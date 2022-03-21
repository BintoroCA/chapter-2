const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');

const db = require('./connection/db');
const upload = require('./middlewares/uploadFile')

const PATH = 'http://localhost:5001/uploads/'

db.connect(function(err, _, done) {
    if (err) throw err;

    console.log('Connection succes');
    done();
});

const app = express();
const PORT = 5001;

const isLogin = false;
let projects = [];

app.set('view engine', 'hbs');

app.use(flash());

app.use(
    session({
        resave: false,
        secret: 'secret',
        cookie: { maxAge: 1000 * 60 * 60 },
        saveUninitialized: true,
    })
);

app.use('/public', express.static(__dirname + '/public'));
app.use('/uploads', express.static(__dirname + '/uploads'));

app.use(express.urlencoded({extended: false}));


app.get('/', function(req, res) {

    console.log('User session Login: ', req.session.isLogin ? true : false);
    console.log('User : ', req.session.user ? req.session.user : {});

    db.connect(function (err, client, done) {

        // to select data from specific id we can make it like this

        let query = '';

        if (req.session.isLogin) {
        query =  `SELECT tb_project_data.*, tb_user.id as "user_id", tb_user.name, tb_user.email
                FROM tb_project_data LEFT JOIN tb_user
                ON tb_project_data.author_id = tb_user.id
                WHERE tb_user.id=${req.session.user.id} 
                ORDER BY id ASC`;
        } else {
        query = `SELECT tb_project_data.*, tb_user.id as "user_id", tb_user.name, tb_user.email
                FROM tb_project_data LEFT JOIN tb_user
                ON tb_project_data.author_id = tb_user.id 
                ORDER BY id ASC`;
        }

        // const query = `SELECT tb_project_data.*, tb_user.id as "user_id", tb_user.name, tb_user.email
        //                 FROM tb_project_data LEFT JOIN tb_user
        //                 ON tb_project_data.author_id = tb_user.id 
        //                 ORDER BY id ASC`;
        client.query(query, function(err, result) {
            if (err) throw err;
    

            let data = result.rows[0];
     
            let dataProjects = result.rows.map(function (data) {

                const user_id = data.user_id ? data.user_id: '-';
                const name = data.name ? data.name: '-';
                const email = data.email ? data.email: '-';

                delete data.user_id;
                delete data.name;
                delete data.email;

                // const PATH = 'http://localhost:5001/uploads/'

             return {
                ...data,
                 duration: timeDuration(data.startdate, data.enddate),
                 isLogin: req.session.isLogin,
                 author: {
                     user_id,
                     name,
                     email,
                 },
                 image: PATH + data.image,
             };  
             
         });
         console.log(dataProjects);
         res.render('index', {
            //  image: PATH + data.image,
             user: req.session.user,
             isLogin: req.session.isLogin, 
             projects: dataProjects});
         });
        });
});

app.get('/add-project', function(req, res) {
    res.render('add-project');
});

app.get('/detail-project', function(req, res) {
    res.render('detail-project');
});

app.get('/detail-project/:id', function (req, res) {
        let id = req.params.id;

    db.connect(function (err, client, done) {

        const query = `SELECT tb_project_data.*, tb_user.id as "user_id", tb_user.name, tb_user.email
                        FROM tb_project_data LEFT JOIN tb_user
                        ON tb_project_data.author_id = tb_user.id WHERE tb_project_data.id=${id}`;

        client.query(query, function(err, result) {
            if (err) throw err;
            done()

            let data = result.rows[0];
            
            data = {
                 ...data,
                 author: {
                    user_id: data.user_id,
                    name: data.name,
                    email: data.email,
                 },
                 duration: timeDuration(data.startdate, data.enddate),
                 timestartformat: timeFormat(data.startdate),
                 timeendformat: timeFormat(data.enddate),
             };
             
                delete data.user_id;
                delete data.name;
                delete data.email;
                console.log(data)
         res.render('detail-project', { project: data});
         });
    });
});

app.get('/update-project/:id', function (req, res) {
    
    let id = req.params.id;
    // console.log('id project ', id);
    db.connect(function (err, client, done) {
        if (err) throw err;
        const query = `SELECT * FROM tb_project_data WHERE id=${id}`;

        // console.log(query);
        client.query(query, function (err, result) {
            if (err) throw err;

            let data = result.rows[0];
            data = {
                ...data,
                image: PATH + data.image,
                startdate: renderDate(data.startdate),
                enddate: renderDate(data.enddate),
                nodejs: viewCheck(data.nodejs),
                reactjs: viewCheck(data.reactjs),
                nextjs: viewCheck(data.nextjs),
                typescript: viewCheck(data.typescript)
            }
            // console.log(data);
            res.render('update-project', { updateproject: data });

            done();
        });
    });
});

app.get('/delete-project/:id', function(req, res) {
    let id = req.params.id;

    db.connect(function (err, client, done) {
        if (err) throw err;

        const query = `DELETE FROM tb_project_data WHERE id=${id}`;

        client.query(query, function (err, result) {
            if (err) throw err;
            done();
            res.redirect('/');
        });
    });
});

app.get('/register', function(req, res) {
    res.render('register');
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});

app.get('/contact-me', function(req, res) {
    res.render('contact-me');
});

app.post('/add-project', upload.single('image'), function(req, res) {
    let data = req.body;

    db.connect(function (err, client, done) {
        if (err) throw err;

        const query = `INSERT INTO tb_project_data (projectname, startdate, enddate, description, image, nodejs, nextjs, reactjs, typescript, author_id) 
                        VALUES ('${data.projectname}','${data.startdate}','${data.enddate}','${data.description}','${req.file.filename}', '${checkboxRender(data.nodejs)}', '${checkboxRender(data.nextjs)}', '${checkboxRender(data.reactjs)}', '${checkboxRender(data.typescript)}', '${req.session.user.id}')`;
        
        client.query(query, function (err, result) {
            if (err) throw err;
            done();
            res.redirect('/');
        });
    });    
});

app.post('/update-project/:id', upload.single('image'), function (req, res) {
    let id = req.params.id;

    let update = req.body;
    db.connect(function (err, client, done) {
        if (err) throw err;

        const query = `UPDATE tb_project_data
         SET projectname= '${update.projectname}', startdate= '${update.startdate}', enddate='${update.enddate}', description='${update.description}', image='${req.file.filename}', nodejs='${checkboxRender(update.nodejs)}', reactjs='${checkboxRender(update.reactjs)}', nextjs='${checkboxRender(update.nextjs)}', typescript='${checkboxRender(update.typescript)}'
         WHERE id=${id}`;

        //  console.log(query)
        client.query(query, function (err, result) {
            if (err) throw err;

            done();
        });
    });

    res.redirect("/");
});

app.post('/register', function (req, res) {
    const data = req.body;

    if (data.name == ''|| data.email == '' || data.password == '') {
        req.flash('error', 'Please insert all field!');
        return res.redirect('/register');
    }

    const hashedPassword = bcrypt.hashSync(data.password, 10);

    db.connect(function (err, client, done) {
        if (err) throw err;

        const query = `INSERT INTO tb_user(name,email,password) VALUES('${data.name}','${data.email}','${hashedPassword}')`;

        client.query(query, function (err, result) {
            if (err) throw err;
            done();
            req.flash('success', 'Success register your account!');
            res.redirect('/login');
        });
    });
});

app.post('/login', function (req, res) {
    const data = req.body;

    if (data.email == '' || data.password == '') {
        req.flash('error', 'Please insert all field!');
        return res.redirect('/login');
      }

    db.connect(function(err, client, done) {
        if (err) throw err;

        const query = `SELECT * FROM tb_user WHERE email = '${data.email}'`;

        client.query(query, function (err, result) {
            if (err) throw err;
            done();

            if (result.rows.lenght == 0) {
                req.flash('error', 'Email not found!');
                return res.redirect('/login');
            }; 
            
            const isMatch = bcrypt.compareSync(
                data.password,
                result.rows[0].password,
            );

            if (isMatch == false) {
                // req.flash('error', 'Wrong password!');
                return res.redirect('/login');
            } else {
                req.session.isLogin = true;
                req.session.user = {
                    id: result.rows[0].id,
                    email: result.rows[0].email,
                    name: result.rows[0].name,
                };
                res.redirect('/');
            };
        });
    });
});

app.listen(PORT, function () {
    console.log(`Server starting on PORT: ${PORT}`);
});

function timeDuration(startdate, enddate) {
    let Start = new Date(startdate);
    let End = new Date(enddate);
    let difference = End - Start;

    let dayDifference = Math.floor(difference / (24 * 60 * 60 * 1000)); // to get day or equal to 86.400.000 milliseconds
    let weekDifference = Math.floor(difference / (7 * 24 *60 * 60 * 1000)); // to get week or equal to 604.800.000 milliseconds
    let monthDifference = Math.floor(difference / (4 * 7 * 24 *60 * 60 * 1000)); // to get month or equal to 2.419.200.000 milliseconds

    if(difference < 604800000) {
        return dayDifference + ' hari';
    } else if(difference >= 604800000 && difference < 2419200000 && difference % 604800000 == 0) {
        return weekDifference + ' minggu';
    } else if(difference >= 604800000 && difference < 2419200000 && difference % 604800000 > 0) {
        let remainingDayDifference = Math.floor((difference % 604800000) / (24 * 60 * 60 * 1000)) 
        return weekDifference + ' minggu ' + remainingDayDifference + ' hari';
    } else if(difference >= 2419200000 && difference % 2419200000 == 0) {
        return monthDifference + ' bulan';
    } else if(difference >= 2419200000 && difference % 2419200000 > 0 && (difference % 2419200000) % 604800000 > 1) {
        let remainingWeekDifference = Math.floor((difference % 2419200000) / (7 * 24 *60 * 60 * 1000));
        let remainingDayDifference = Math.floor(((difference % 2419200000) % 604800000) / (24 * 60 * 60 * 1000))
        return monthDifference + ' bulan ' + remainingWeekDifference + ' minggu ' + remainingDayDifference + ' hari';
    }else {
        let remainingWeekDifference = Math.floor((difference % 2419200000) / (7 * 24 *60 * 60 * 1000));
        return monthDifference + ' bulan ' + remainingWeekDifference + ' minggu';
    }
}

function timeFormat(time) {
    let month = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
  
    let date = time.getDate();
    let monthIndex = time.getMonth();
    let year = time.getFullYear();
  
    let hour = time.getHours();
    let minute = time.getMinutes();
  
    let fullTime = `${date} ${month[monthIndex]} ${year}`;
  
    return fullTime;
  }

// function techIcon (technologies) {
    // let techicon [
    //     'nodejs',
    //     'nextjs',
    //     'reactjs',
    //     'typescript',
    // ];
    // let nodejs = techicon[0]
    // let nextjs = techicon[1]
    // let reactjs = techicon[2]
    // let typescript = techicon[3]

    // let nodejs = technologies;
//     if (technologies = true) {
//         return 'nodejs'
//     };
// };

function checkboxRender(chck) { 
    if (chck == "true") {
        return true
    } else {
        return false
    }
};


function renderDate(time) {

    let hari = [
        "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"
    ]

    let bulan = [
        "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"
    ]

    let date = time.getDate();
    let monthIndex = time.getMonth();
    let year = time.getFullYear();

    let fullTime = `${year}-${bulan[monthIndex]}-${hari[date]}`;

    return fullTime;
}

function viewCheck(par1) {
    if (par1 == true) {
        return 'checked'
    } else if (par1 != true) {
        return ""
    }
}