const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')

//membuat aplikasi framework express
const app = express()
const port = 8080
//inisialisasi secret key yang digunakan oleh JWT
const secretKey = 'thisisverysecretkey'


//enable body-parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

//koneksi -> database
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tokosepeda'
})

conn.connect((err) => {
    if(err) throw err
    console.log('Connected............')
})

//-------------------------------Authorazation---------------------------//

//admin
const isAuthorized = (req, res, next) => {
        if(typeof(req.headers['x-api-key']) == 'undefined')
        {
            return res.status(403).json({
                success: false,
                message: 'Unathorized Token is not provided'
            })
        }


    let token = req.headers['x-api-key']

    jwt.verify(token, secretKey, (err, decoded) => {
        if(err)
        {
            return res.status(403).json({
                success: false,
                message: 'Unathorized Token is not provided'
            })
        }
    })

    next()
}

//users
const isAuthorizedUsers = (req, res, next) => {
    if(typeof(req.headers['x-api-key']) == 'undefined')
    {
        return res.status(403).json({
            success: false,
            message: 'Unathorized Token is not provided'
        })
    }


let token = req.headers['x-api-key']

jwt.verify(token, secretKey, (err, decoded) => {
    if(err)
    {
        return res.status(403).json({
            success: false,
            message: 'Unathorized Token is not provided'
        })
    }
})

next()
}


//=========== list end point ============//

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Selamat Datang'
    })
})

//--------------REGISTER-------------//

app.post('/register', (req, res) => {
    let data = req.body
    let sql = `
        insert into users(username, password)
        values('`+data.username+`','`+data.password+`')
    `
    conn.query(sql, (err, res) => {
        if(err) throw err
    })

    res.json({
        success: true,
        message: 'Register Success',
        username: data.username,
        password: data.password,

    })
})


//--------------LOGIN----------------// admin
app.post('/login/admin', (req, res) => {
    let data = req.body

    if(data.username == 'admin' && data.password == 'admin')
    {
        let token = jwt.sign(data.username + ' | ' + data.password, secretKey)

        res.json({
            success: true,
            message: 'Admin Login',
            username: data.username,
            password: data.password,
            token: token
        })
    }
    res.json({
        success: false,
        message: 'riko sanes seng nduwe username admin karo password admin'
    })
})

//--------------LOGIN----------------// users
app.post('/login/users', function(req, res) {
    let data = req.body
    var username = data.username;
    var password = data.password;
    if(username && password)
    {
        conn.query(`select * from users where username = ? and password = ?`, [username, password], function(err, results, fields) {
            if(results.length > 0) {
                let token = jwt.sign(data.username + '|' + data.password, secretKey)
                res.json({
                    success: true,
                    message: 'User Login',
                    username: data.username,
                    password: data.password,
                    token: token
                });
            }
            else
            {
                res.json({
                    success: false,
                    message: 'Invalid',
                });
            }
            res.end();
        });
    }
});

app.get('/users', (req, res) => {
    let sql = `select * from users`
    conn.query(sql, (err, result) => {
        if(err) throw err
        res.json({
            success: true,
            data: result
        })
    })
})

app.get('/sepeda', isAuthorized, (req, res) => {
    let sql = 'select * from sepeda_motor'
    conn.query(sql, (err, result) => {
        if(err) throw err
        res.json({
            success: true,
            message: 'update terbaru!',
            title: '-------------------DAFTAR SEPEDA MOTOR--------------------',
            data: result
        })
    })
})

app.post('/sepeda', isAuthorized, (req, res) => {
    let data = req.body
    let sql = `
        insert into sepeda_motor(id, merk_sepeda_motor, warna, tahun, harga, stok)
        values('`+data.id+`','`+data.merk_sepeda_motor+`','`+data.warna+`','`+data.tahun+`','`+data.harga+`','`+data.stok+`');
    `

    conn.query(sql, (err, result) => {
        if(err) throw err
    })
    res.json({
        success: true,
        message: 'Sepeda berhasil ditambah di daftar sepeda motor'
    })
})

app.put('/sepeda/:id', isAuthorized, (request, result) => {
    let data = request.body
    let sql =`
        update sepeda_motor
        set merk_sepeda_motor = '`+data.merk_sepeda_motor+`', warna = '`+data.warna+`', tahun = '`+data.tahun+`', harga = '`+data.harga+`', stok = '`+data.stok+`'
        where id = `+request.params.id+`
    `

    conn.query(sql, (err, result) => {
        if(err) throw err
    })
    result.json({
        success: true,
        message: 'Data updated'
    })
})


app.delete('/sepeda/:id', isAuthorized, (request, result) => {
    let sql =`
        delete from sepeda_motor where id = `+request.params.id+`
    `

    conn.query(sql, (err, res) => {
        if(err) throw err
    })
    result.json({
        success: true,
        message: 'Data deleted'
    })
})

//---------------------------------------Transaksi Sepeda Motor--------------------------------//

app.get('/data/user_motor', (req, res)=>{
    let sql = `select * from user_motor inner join sepeda_motor on user_motor.motor_id = sepeda_motor.id
    inner join users on user_motor.user_id = users.id`;

    conn.query(sql, (err, result) =>{
        if(err) throw err
        else{
            res.json({
                success: true,
                data: result
            })
        }
    })

})

app.get('/data/:id/user_motor', isAuthorized, (req, res) =>{
    let sql = `select * from user_motor where id = `+req.params.id;
    conn.query(sql, (err, result) =>{
        if(err) throw err
        else{
            res.json({
                success: true,
                data: result
            })
        }
    })
})

app.post('/input/:motor_id/user_motor', isAuthorized, (req, res)=>{
    const data = req.body;
    let sql = 'insert into user_motor (user_id, motor_id) values('+data.user_id+',' +data.motor_id+')'

    conn.query(sql, (err, result) =>{
        if(err) throw err
    })
    conn.query('update sepeda_motor set stok = -1 where id = '+req.params.motor_id, (err)=>{
        if(err) throw err
    })
    res.json({
        message: 'Input success'
    })
})

app.put('/update/:id/user_motor', isAuthorized, (req, res)=>{
    const data = req.body
    let sql = 'update user_motor set user_id = '+data.user_id+', motor_id = ' +data.motor_id+' where id = '+req.params.id

    conn.query(sql, (err, result)=>{
        if(err) throw err
        else{
            res.json({
                success: true,
                data: result
            })
        }
    })
})

app.delete('/delete/:id/user_motor', isAuthorized, (req, res) =>{
    let sql = 'delete from user_motor where id = '+req.params.id
    conn.query(sql, (err, result) =>{
        if(err) throw err
        else{
            res.json({
                success: true,
                message: "You are successfully delete the data"
            })
        }
    })
})

//----------------------------------Transaksi Sparepart-------------------------------------//

app.get('/data/user_sparepart', isAuthorized, (req, res)=>{
    let sql = "select * from user_sparepart";

    conn.query(sql, (err, result) =>{
                if(err) throw err
                else{
                    res.json({
                        success: true,
                        data: result
                    })
                }
    })
})

app.get('/data/:id/user_sparepart', isAuthorized, (req, res) =>{
    let sql = `select * from user_sparepart where id = `+req.params.id;
    conn.query(sql, (err, result) =>{
        if(err) throw err
        else{
            res.json({
                success: true,
                data: result
            })
        }
    })
})

app.post('/input/user_sparepart', isAuthorized, (req, res)=>{
    const data = req.body;
    let sql = 'insert into user_sparepart (user_id, sparepart_id) values('+data.user_id+', ' +data.sparepart_id+')'

    conn.query(sql, (err, result) =>{
        if(err) throw err
        else{
            res.json({
                success: true,
                data: result
            })
        }
    })
})

app.put('/update/:id/user_sparepart', isAuthorized, (req, res)=>{
    const data = req.body
    let sql = 'update user_sparepart set user_id = '+data.user_id+', sparepart_id = ' +data.sparepart_id+' where id = '+req.params.id

    conn.query(sql, (err, result)=>{
        if(err) throw err
        else{
            res.json({
                success: true,
                data: result
            })
        }
    })
})

app.delete('/delete/:id/user_sparepart', isAuthorized, (req, res) =>{
    let sql = 'delete from user_sparepart where id = '+req.params.id
    conn.query(sql, (err, result) =>{
        if(err) throw err
        else{
            res.json({
                success: true,
                message: "You are successfully delete the data"
            })
        }
    })
})
app.listen(8080, () => {
    console.log('port nyambung ' + port)
})
