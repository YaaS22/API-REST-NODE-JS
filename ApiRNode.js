var express = require('express');
var port = 8001;
var app = express();

var PHPUnserialize = require('php-unserialize');
const Serialize = require('php-serialize')
//var jwt = require('jsonwebtoken');
//var expressJwt = require('express-jwt');

var bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//require mysql
var mysql = require('mysql');

//mysql connexion
var connection = mysql.createConnection({
 host : '127.0.0.1',
 user : '',
 password : '',
 database : 'REST'
});

connection.connect(function(err) {
 if (err) throw err;
 console.log("Connected!");
});

app.all('/*', function(req, res, next) {
 // CORS headers
 res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
 res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
 // Set custom headers for CORS
 res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
 if (req.method == 'OPTIONS') {
 res.status(200).end();
 } else {
 next();
 }
});


app.get('/api/recipes.json', function(req, res) {
 var user_id = req.param('user')
 console.log(req.param('user'));
 if (user_id == undefined)
 {
 connection.query('select id, name, slug from recipes__recipe', function(error,data){
 res.send({
 code:200,
 message:'success',
 datas:data
 });
 });
 }else{
 var sql1 = 'select id, name, slug from recipes__recipe WHERE user_id = "'+user_id+'"';

 connection.query(sql1, function(err,data) {
 if (err) throw err;
 var user = data[0];
 if (user == undefined) {
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
 }else{
 res.send({
 code:200,
 message:'success',
 datas:data
 });
 }
 });
 }
});

// app.get('/api/recipes.json', function(req, res) {
// console.log('ouai');
//
// });
app.get('/api/recipes/:name.json', function(req, res) {
 var name_recette = req.params.name;
 //console.log(name_recette);
 //var sql1 = 'select id, user_id, name, slug, step from recipes__recipe';
 var sql1 = 'SELECT id, user_id, name, slug, step FROM recipes__recipe WHERE slug = "'+name_recette+'"';

 connection.query(sql1, function(err,data){
 if (err) throw err;
 var recipe = data[0];
 if (recipe == undefined)
 {
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
 }
 var step = PHPUnserialize.unserialize(recipe.step);
 //console.log(recipe.step);
 connection.query('SELECT us.username, us.last_login, us.id FROM users__user AS us WHERE us.id ="'+recipe.user_id+'"', function(err,data1){
 if (err) throw err;

 recipe["user_id"] = recipe["user"];
 recipe["user"] = data1[0];
 recipe["step"] = step;
 res.send({
 code:200,
 message:'success',
 datas: recipe
 });
 });
 });

});

app.get('/api/users/:username/recipes.json', function(req, res) {

 var username = req.params.username;
 //console.log(username);
 var sql3 = 'select recipes__recipe.id ,name, slug from users__user inner join recipes__recipe on users__user.id = recipes__recipe.user_id where username="' + username + '"';
 connection.query(sql3, function(error,data2){
 var user = data2[0];
 if (user == undefined)
 {
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
 }else{
 res.send({
 code:200,
 message:'success',
 datas:data2
 });
 }

 });
});
//
// app.get('/api/users/:user/recipes.json', function(req, res) {
// var user = req.params.user;
// var sql2 = "SELECT id FROM users__user WHERE username = "+user;
// //var sql1 = "SELECT id, name, slug FROM recipes__recipe WHERE user_id = "+user;
// connection.query(sql2, function(error,data_id_user){
// console.log(data_id_user);
// connection.query(sql1, function(error,data){
// res.send({
// code:200,
// message:'success',
// datas:data
// });
// });
// });
//
// });



//
// const request = require('request-promise');
//
// const options = {
// method: 'POST',
// uri: '/api/users/etna/recipes.json',
// //body: req.body,
// json: true,
// headers: {
// 'Content-Type': 'application/json',
// 'Authorization': 'etna'
// }
// }
//
// request(options).then(function (response){
// res.status(200).send(response);
// })
// .catch(function (err) {
// console.log(err);
// })
//
//
// var mySecret = 'etna';
// //post
//
// //app.use('/api/users/etna/recipes.json', expressJwt({secret: mySecret}));
//
app.post('/api/users/:username/recipes.json', function(req, res) {
 //var token = jwt.sign({username: 'etna'}, mySecret);
 var username = req.params.username;
 console.log(username);
 //console.log(req.get('authorization'));
 //console.log(req.body.name);
 var sql_get_user = 'SELECT id, username FROM users__user WHERE username = "'+username+'"';
 connection.query(sql_get_user, function (err, result) {
 if (err) throw err;
 var user_exist = result[0];
 if (user_exist == undefined)
 {
 res.status(401);
 res.send({
 code:401,
 message:'Unauthorized'
 //datas: data_recipes
 });
 }else{
 console.log(user_exist);
 if (req.get('authorization') != user_exist.username)
 {
 res.status(403);
 res.send({
 code:403,
 message:'Forbidden'
 //datas: data_recipes
 });
 }else{
 console.log('valide');
 var step = Serialize.serialize(req.body.step);
 var sql_insert = "INSERT INTO recipes__recipe (name, user_id, slug, step) VALUES ('"+req.body.name+"','"+user_exist.id+"','"+req.body.slug+"','"+step+"')";
 connection.query(sql_insert, function (err, result_insert) {
 if (err) throw err;
 console.log(result_insert.insertId);
 //debut
 //var sql1 = 'select id, user_id, name, slug, step from recipes__recipe';
 var sql1 = 'SELECT id, user_id, name, slug, step FROM recipes__recipe WHERE id = "'+result_insert.insertId+'"';

 connection.query(sql1, function(err,data){
 if (err) throw err;
 var recipe = data[0];
 if (recipe == undefined)
 {
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
 }
 var step = PHPUnserialize.unserialize(recipe.step);
 //console.log(recipe.step);
 connection.query('SELECT us.username, us.last_login, us.id FROM users__user AS us WHERE us.id ="'+recipe.user_id+'"', function(err,data1){
 if (err) throw err;

 recipe["user_id"] = recipe["user"];
 recipe["user"] = data1[0];
 recipe["step"] = step;
 res.send({
 code:201,
 message:'success',
 datas: recipe
 });
 });
 });
 //fin
 });
 }

 }

 });
});


//etape 6 PUT
app.put('/api/users/:username/recipes/:slug.json', function(req, res) {
 //var token = jwt.sign({username: 'etna'}, mySecret);
 var username = req.params.username;
 var slug = req.params.slug;
 console.log(username);
 var sql_get_user = 'SELECT id, username FROM users__user WHERE username = "'+username+'"';
 connection.query(sql_get_user, function (err, result) {
 if (err) throw err;
 var user_exist = result[0];
 if (user_exist == undefined)
 {
 res.status(401);
 res.send({
 code:401,
 message:'Unauthorized'
 //datas: data_recipes
 });
 }else{
 console.log(user_exist);
 if (req.get('authorization') != user_exist.username)
 {
 res.status(403);
 res.send({
 code:403,
 message:'Forbidden'
 //datas: data_recipes
 });
 }else{
 //variables a modifier dans la recette
 var name_update = req.body.name;
 var slug_update = req.body.slug;
 var step_update = req.body.step;

 //recuperation de la recette et verification si elle appartient a l'utilisateur :username
 var sql1 = 'SELECT id, user_id, name, slug, step FROM recipes__recipe WHERE slug = "'+slug+'"';
 connection.query(sql1, function(err,data) {
 if (err) throw err;
 var recipe1 = data[0];
 if (recipe1 == undefined) {
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
 }else{
 //si le user n'est pas le proprietaire de la recette on lui renvoie une 403
 if (recipe1.user_id != user_exist.id){
 res.status(403);
 res.send({
 code:403,
 message:'Forbidden'
 //datas: data_recipes
 });
 }else{
 var sql_update = 'UPDATE recipes__recipe SET name="'+name_update+'" WHERE slug = "'+slug+'"';
 connection.query(sql_update, function(err,data) {
 console.log('update');
 //debut
 //var sql1 = 'select id, user_id, name, slug, step from recipes__recipe';
 var sql1 = 'SELECT id, user_id, name, slug, step FROM recipes__recipe WHERE id = "'+recipe1.id+'"';

 connection.query(sql1, function(err,data){
 if (err) throw err;
 var recipe = data[0];
 if (recipe == undefined)
 {
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
 }
 var step = PHPUnserialize.unserialize(recipe.step);
 //console.log(recipe.step);
 connection.query('SELECT us.username, us.last_login, us.id FROM users__user AS us WHERE us.id ="'+recipe.user_id+'"', function(err,data1){
 if (err) throw err;

 recipe["user_id"] = recipe["user"];
 recipe["user"] = data1[0];
 recipe["step"] = step;
 res.send({
 code:200,
 message:'success',
 datas: recipe
 });
 });
 });
 //fin

 });
 }
 }
 });
 console.log('valide');
 }

 }

 });
});



app.delete('/api/users/:username/recipes/:slug.json', function(req, res) {
 //var token = jwt.sign({username: 'etna'}, mySecret);
 var username = req.params.username;
 var slug = req.params.slug;
 console.log(username);
 var sql_get_user = 'SELECT id, username FROM users__user WHERE username = "'+username+'"';
 connection.query(sql_get_user, function (err, result) {
 if (err) throw err;
 var user_exist = result[0];
 if (user_exist == undefined)
 {
 res.status(401);
 res.send({
 code:401,
 message:'Unauthorized'
 //datas: data_recipes
 });
 }else{
 console.log(user_exist);
 if (req.get('authorization') != user_exist.username)
 {
 res.status(403);
 res.send({
 code:403,
 message:'Forbidden'
 //datas: data_recipes
 });
 }else{

 //recuperation de la recette et verification si elle appartient a l'utilisateur :username
 var sql1 = 'SELECT id, user_id, name, slug, step FROM recipes__recipe WHERE slug = "'+slug+'"';
 connection.query(sql1, function(err,data) {
 if (err) throw err;
 var recipe1 = data[0];
 if (recipe1 == undefined) {
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
 }else{
 //si le user n'est pas le proprietaire de la recette on lui renvoie une 403
 if (recipe1.user_id != user_exist.id){
 res.status(403);
 res.send({
 code:403,
 message:'Forbidden'
 //datas: data_recipes
 });
 }else{
 var data_return = {};
 var sql_delete = 'DELETE FROM recipes__recipe WHERE slug = "'+slug+'"';
 connection.query(sql_delete, function(err,data) {
 data_return["id"] = recipe1.id;
 res.send({
 code:200,
 message:'success',
 datas: data_return
 });

 });
 }
 }
 });
 //console.log('valide');
 }

 }

 });
});

//etape 8
app.get('/api/users/:username.json', function(req, res) {
 //var token = jwt.sign({username: 'etna'}, mySecret);
 var username = req.params.username;
 var data_final = {};
 console.log(username);
 var sql_get_user = 'SELECT id, username, email_canonical, last_login, roles FROM users__user WHERE username = "'+username+'"';
 connection.query(sql_get_user, function (err, result) {
 if (err) throw err;
 var user_exist = result[0];
 //console.log(user_exist);
 if (user_exist == undefined)
 {
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
 }else{
 data_final["username"] = user_exist.username;
 data_final["last_login"] = user_exist.last_login;
 data_final["id"] = user_exist.id;
 if (req.get('authorization') == undefined)
 {
 //recupere les info sans le role

 res.status(200);
 res.send({
 code: 200,
 message: "success",
 datas: data_final
 });

 }else if(req.get('authorization') != undefined && req.get('authorization') == user_exist.username){
 // recupere toutes les infos du user
 var role = PHPUnserialize.unserialize(user_exist.roles);
 data_final["roles"] = role;
 data_final["email"] = user_exist.email_canonical;

 res.status(200);
 res.send({
 code: 200,
 message: "success",
 datas: data_final
 });

 }else{
 res.status(403);
 res.send({
 code:403,
 message:'Forbidden'
 //datas: data_recipes
 });
 }

 }

 });
});



//GET 404
app.get('*', function(req, res){
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
});

//POST 404
app.post('*', function(req, res){
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
});

//put 404
app.put('*', function(req, res){
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
});

//delete 404
app.delete('*', function(req, res){
 res.status(404);
 res.send({
 code: 404,
 message: "Not found"
 });
});



//app.get('/recipes')
app.listen(port, function(){
 console.log("API Running on port " + port);
});