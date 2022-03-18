const express = require('express');

const db = require('./connection/db');

db.connect(function(err, _, done) {
    if (err) throw err;

    console.log('Connection succes');
    done();
});

const app = express();
const PORT = 5001;

const isLogin = true;
let projects = [];

app.set('view engine', 'hbs');

app.use('/public', express.static(__dirname + '/public'));

app.use(express.urlencoded({extended: false}));


app.get('/', function(req, res) {

    db.connect(function (err, client, done) {
        const query = 'SELECT * FROM tb_project_data';
        client.query(query, function(err, result) {
            if (err) throw err;
    

            let data = result.rows[0];
            // console.log(data);
         //    map for data project
     
            let dataProjects = result.rows.map(function (data) {
             return {
                 
                 duration: timeDuration(data.startdate, data.enddate),
                //  technologies: techIcon(data.technologies),
                 isLogin, 
                 ...data,
             };
         });
        //  console.log(data.technologies);
         res.render('index', {isLogin , projects: dataProjects});
         });
    });
});

app.get('/detail-project/:id', function (req, res) {
    let id = req.params.id;

    db.connect(function (err, client, done) {

        const query = `SELECT * FROM tb_project_data WHERE id=${id}`;

        client.query(query, function(err, result) {
            if (err) throw err;
            done()

            let data = result.rows[0];
            
            // console.log(data);
         //    map for data project

         let start = new Date(data.startdate);
         let end = new Date(data.enddate);

            data = {
                 ...data,
                 duration: timeDuration(start, end),
                 timestartformat: timeFormat(start),
                 timeendformat: timeFormat(end),
             };
        
         res.render('detail-project', { project: data});
         });
    });
});

app.get('/add-project', function(req, res) {
    res.render('add-project');
});

app.post('/add-project', function(req, res) {
    let data = req.body;

    db.connect(function (err, client, done) {
        if (err) throw err;

        const query = `INSERT INTO tb_project_data (projectname, startdate, enddate, description, image, nodejs, nextjs, reactjs, typescript) VALUES ('${data.projectname}','${data.startdate}','${data.enddate}','${data.description}','${data.image}', '${checkboxRender(data.nodejs)}', '${checkboxRender(data.nextjs)}', '${checkboxRender(data.reactjs)}', '${checkboxRender(data.typescript)}')`;
        
        client.query(query, function (err, result) {
            if (err) throw err;
            done();
            res.redirect('/');
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

app.get('/detail-project', function(req, res) {
    res.render('detail-project');
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

app.post('/update-project/:id', function (req, res) {
    let id = req.params.id;

    let update = req.body;
    db.connect(function (err, client, done) {
        if (err) throw err;

        const query = `UPDATE tb_project_data
         SET projectname= '${update.projectname}', startdate= '${update.startdate}', enddate='${update.enddate}', description='${update.description}', image='image.png', nodejs='${checkboxRender(update.nodejs)}', reactjs='${checkboxRender(update.reactjs)}', nextjs='${checkboxRender(update.nextjs)}', typescript='${checkboxRender(update.typescript)}'
         WHERE id=${id}`;

         console.log(query)
        client.query(query, function (err, result) {
            if (err) throw err;

            done();
        });
    });

    res.redirect("/");
});

app.get('/contact-me', function(req, res) {
    res.render('contact-me');
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

function techIcon (technologies) {
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
    if (technologies = true) {
        return 'nodejs'
    };
};

function checkboxRender(par1) {
    if (par1 == "true") {
        return true
    } else if (par1 != true) {
        return false
    }
}

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