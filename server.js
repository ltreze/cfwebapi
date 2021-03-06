// server.js
// set up ========================
var express = require('express');
//var router = express.Router();
var path = require('path');
var multer = require('multer');
var app = express();
var mysql = require('mysql');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var async = require('async');
var Sequelize = require('sequelize');
//var Enumerable = require('linq');
var fs = require('fs');
var url = require('url');
var nodemailer = require('nodemailer');

// configuration ==================
app.set('port', (process.env.PORT || 8084));
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride());
app.use(bodyParser({ uploadDir: '/path/to/temporary/directory/to/store/uploaded/files' }));
    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

//temp
var connStr = process.env.CF_MYSQL_CONNSTR;

var connection = mysql.createConnection(connStr);
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

var mailPwd = process.env.CF_MAIL_PWD;
var transporter = nodemailer.createTransport('smtps://catiorofofo.app%40gmail.com:' + mailPwd + '@smtp.gmail.com');

// setup e-mail data with unicode symbols
var mailOptions = {
    from: '"Catioro Fofo" <catiorofofo.app@gmail.com>', // sender address
    to: 'leonardotreze@gmail.com', // list of receivers separados por virgula
    subject: 'sua senha no catioro fofo', // Subject line
    text: 'oi, sua senha no catioro fofo é ', // plaintext body
    html: '<b>oi, sua  Senha no catioro fofo é </b>' // html body
};

//ORM
var sequelize = new Sequelize(connStr, {
    define: {
        timestamps: false,
        freezeTableName: true
    }
});

var Usuario = sequelize.define('usuario', {
    usuarioId: {
        type: Sequelize.INTEGER,
        field: 'usuarioId',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    nomeArquivoAvatar: {
        type: Sequelize.STRING,
        field: 'nomeArquivoAvatar',
        allowNull: true
    },
    email: {
        type: Sequelize.STRING,
        field: 'email',
        allowNull: false
    },
    nomeUsuario: {
        type: Sequelize.STRING,
        field: 'nomeUsuario',
        allowNull: false
    },
    senha: {
        type: Sequelize.STRING,
        field: 'senha',
        allowNull: false
    }}, { tableName: 'Usuario' }
);

var Post = sequelize.define('post', {
    postId: {
        type: Sequelize.INTEGER,
        field: 'PostId',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    legenda: {
        type: Sequelize.STRING,
        field: 'Legenda',
        allowNull: false
    },
    nomeArquivo: {
        type: Sequelize.STRING,
        field: 'NomeArquivo',
        allowNull: false
    },
    usuarioId: {
        type: Sequelize.INTEGER,
        field: 'UsuarioId',
        allowNull: false
    }}, { tableName: 'Post' }
);

var Curtida = sequelize.define('curtida',  {
    postId: {
        type: Sequelize.INTEGER,
        field: 'PostId',
        allowNull: false,
        primaryKey: true
    },
    usuarioId: {
        type: Sequelize.INTEGER,
        field: 'UsuarioId',
        allowNull: false,
        primaryKey: true
    }}, { tableName: 'Curtida' }
);

Post.belongsTo(Usuario, { foreignKey: 'usuarioId'});

Post.hasMany(Curtida, { 
	foreignKey: 'postId',
	constraints: false
});
Curtida.belongsToMany(Post, { 
	through: 'Curtida',
	foreignKey: 'postId',
	constraints: false
});


// routes ==================================================
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
    	console.log('req.body');console.log(req.body);console.log('');
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
    	console.log('file');console.log(file);console.log('');
    	console.log('req.body');console.log(req.body);console.log('');
        var usuarioId = file.originalname.split('.')[0];
        var parteB = file.originalname.split('.')[file.originalname.split('.').length - 1];
        var nomeArquivo = file.fieldname + '_' + usuarioId + '_' + Date.now() + '.' + parteB;
        callback(null, nomeArquivo);
    }
});
var uploadCf = multer({ storage: storage }).single('cf');
app.post('/api/uploadfoto', function (req, res) {
	
	console.log('*** uploadfoto ***');
    console.log('req.body');
    console.log(req.body);
    console.log('');

    uploadCf(req, res, function (err, data) {
        if (err) {
            console.log(err);
            return res.end("Error uploading file.");
        }

        var resposta = { sucesso: true, mensagem: 'foto upload ok', nomeArquivo: req.file.filename };
        console.log(resposta);
        res.json(resposta);
    });
});

var uploadAv = multer({ storage: storage }).single('av');
app.post('/api/uploadavatar', function (req, res) {
	
	console.log('*** upload avatar ***');
    console.log('req.body');
    console.log(req.body);
    console.log('');

    uploadAv(req, res, function (err, data) {
        if (err) {
            console.log(err);
            return res.end("Error uploading avatar.");
        }

        var resposta = { sucesso: true, mensagem: 'avatar upload ok', nomeArquivo: req.file.filename };

        res.json(resposta);
    });
});

app.post('/api/curtir', function (req, res) {

    Curtida.create({
        usuarioId: req.body.usuarioId,
        postId: req.body.postId
    }).then(function (curtidaa) {

        var resposta = { mensagem: "SUCESSO", curtida: curtidaa };

        res.json(resposta);
    });
});

app.post('/api/descurtir', function (req, res) {

    Curtida.destroy({ 
    	where:{
        	usuarioId: req.body.usuarioId,
        	postId: req.body.postId}, 
        force: true 
    }).then(function(){
    	
        var resposta = { mensagem: "SUCESSO" };

        res.json(resposta);
    });
});

app.post('/api/salvarpost', function (req, res) {
	
	console.log('*** salvarpost ***');
    console.log('req.body');
    console.log(req.body);
    console.log('');

    var lPost = req.body;
    var lUsuario = lPost.usuario;

    Post.create({
        legenda: lPost.legenda,
        nomeArquivo: lPost.nomeArquivo,
        usuarioId: lPost.usuario.usuarioId
    }).then(function (pPost) {
        console.log(' callback salvar post.....');
        var postSalvo = { postId: pPost.postId, legenda: lPost.legenda, nomeArquivo: lPost.nomeArquivo, curtidas: lPost.curtidas, 
            usuario: lUsuario };
        console.log(postSalvo);

        res.json(postSalvo);
    }); 
});

app.post('/api/downloadfoto', function (req, res) {

    console.log('req.body');
    console.log(req.body);
    console.log('');
    
    var file = __dirname + '/uploads/' + req.body.nomeArquivo;
    res.download(file); // Set disposition and send it.
});

app.get('/api/foto', function (req, res) {

    var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var na = req.query.na;

    console.log('na');
    console.log(na);
    console.log('');
    
    var file = __dirname + '/uploads/' + na;
    res.download(file); // Set disposition and send it.
});

app.get('/api/obterposts', function (req, res) {

    Post
        .findAll({limit:50, include: [ Curtida, Usuario ], where: { usuarioId: {ne: 0} } })
        .then(function (posts) {


            console.log('***************************************');
            console.log('***     OBTENDO POSTS');
        	console.log('***');
        	console.log('***    ' + JSON.stringify(posts[0]));
        	console.log('***');
            console.log('***************************************');

            res.json(posts);
        });
});
app.get('/api/obterusuarios', function (req, res) {

    Usuario
        .findAll()
        .then(function (usuarios) {

        	console.log('****** posts[0]');
        	console.log(JSON.stringify(usuarios));
        	console.log('');

            res.json(usuarios);
        });
});

app.post('/api/login', function (req, res) {

	console.log('***************************************');
	console.log('***     LOGIN DESEJADO');
	console.log('***');
	console.log('***     email: ' + req.body.email);
	console.log('***     senha: ' + req.body.senha);
	console.log('***');

	var emailDigitado = req.body.email;
	var senhaDigitada = req.body.senha;

    Usuario
        .findAll({ where: { email: emailDigitado, senha: senhaDigitada }})
        .then(function (usuarios) {


        	if (usuarios != null && usuarios.length > 0){
	            console.log('***');
				console.log('***     USUARIO ENCONTRADO');
	            console.log('***     ' + JSON.stringify(usuarios[0]));
	            console.log('***');
	            console.log('***************************************');
	            res.json(usuarios[0]);
        		
        	} else if (usuarios == null || usuarios.length == 0) {



        		console.log('***   USUARIO NAO ENCONTRADO');
	            res.json({ });

        	}
        });
});

app.post('/api/cadastro', function (req, res) {

	var pEmail = req.body.email;
	var pSenha = req.body.senha;
	var pNomeUsuario = req.body.nomeUsuario;
	var pNomeArquivoAvatar = 'avatar.jpg';

	Usuario
		.findOne({ where: {email: pEmail }})
		.then(function(user) {

			if (user == null) {
				Usuario
					.create({ 
						email: pEmail, 
						senha: pSenha, 
						nomeUsuario: pNomeUsuario,
						nomeArquivoAvatar: pNomeArquivoAvatar })
					.then(function(user2) {					
						console.log('usuario nao encontrado com o email passado, mas foi criado um');

			    		res.json({ sucesso: true, mensagem: "SUCESSO", usuario: user2 });
		    		});
			} else {
				console.log('3');
				res.json({ sucesso: true, mensagem: 'JAEXISTE', usuario: user });
			}
	});
});

app.post('/api/atualizarusuario', function (req, res) {

	console.log('***************************************');
	console.log('***     ATUALIZANDO USUARIO');
	console.log('***');
	console.log('***     email: ' + req.body.email);
	console.log('***     usuarioId: ' + req.body.usuarioId);
	console.log('***     nomeUsuario: ' + req.body.nomeUsuario);
	console.log('***     nomeArquivoAvatar: ' + req.body.nomeArquivoAvatar);
	console.log('***');
	var pEmail = req.body.email;
	var pUsuarioId = req.body.usuarioId;
	var pNomeUsuario = req.body.nomeUsuario;
	var pNomeArquivoAvatar = req.body.nomeArquivoAvatar;

    Usuario
        .findAll({ where: { nomeUsuario: pNomeUsuario }})
        .then(function(users) {
 
            var nomeDeUsuarioDisponivel = users.length < 1 || users == null;

            if (nomeDeUsuarioDisponivel) {

                Usuario
                    .findOne({ where: { email: pEmail, usuarioId: pUsuarioId }})
                    .then(function(user1) { 

                        if (user1 != null) {
                            user1
                                .update({ nomeUsuario: pNomeUsuario, nomeArquivoAvatar: pNomeArquivoAvatar })
                                .then(function(user2) {
                                    console.log('***');
                                    console.log('***     atualizou usuario id #' + user2.usuarioId + ' com o nome de usuario novo: ' + pNomeUsuario);
                                    console.log('***');
                                    console.log('***     ' + JSON.stringify(user2));
                                    console.log('***');
                                    console.log('***************************************');

                                    res.json(user2);
                                });
                        } else {
                            console.log('***');
                            console.log('***     nao encontrado usuario que quer editar o perfil. Email: ' + pEmail);

                            res.json({ mensagem: 'INEXISTENTE' });
                        }
                });
            } else {
                Usuario
                    .update(
                        { nomeArquivoAvatar: pNomeArquivoAvatar, nomeUsuario: pNomeUsuario },
                        { where: { usuarioId: pUsuarioId }})
                    .then(function(user3) {
                        console.log('***');
                        console.log('***     atualizou usuario id #' + pUsuarioId + ' com o nome de usuario: ' + pNomeUsuario + ' e nomeArquivoAvatar: ' + pNomeArquivoAvatar );
                        console.log('***');
                        console.log('***************************************');
                        res.json(user3);
                    });
            }
        });
});

app.post('/api/esquecisenha', function (req, res) {

	var emailDigitado = req.body.email;

    Usuario
        .findAll({ where: { email: emailDigitado } })
        .then(function (usuarios) {

        	if (usuarios.length == 1){

	            mailOptions.to = emailDigitado;
	            mailOptions.html = mailOptions.html + usuarios[0].senha;

				transporter.sendMail(mailOptions, function(error, info){
    				if(error){
	            		res.json({ mensagem: "error", sucesso: false});
        				return console.log(error);
    				}
    				console.log('Message sent: ' + info.response);
	            res.json({ mensagem: "email enviado", sucesso: true});
				});

        	} else {
        		res.json({ mensagem: "nao foi encontrado usuario com esse email", sucesso: false });
			}
        });
});

app.get('/imagens', function(req, res){
    console.log(' - - - - - - - - imagens - - - - - - - - ');

    var todasImagens = [];

    const testFolder = __dirname + '/uploads/';
    console.log('testFolder');
    console.log(testFolder);
    console.log('');
    const fs = require('fs');
    fs.readdir(testFolder, (err, files) => {

        console.log('TODOS OS ARQUIVOS DO DIRETORIO');console.log(files);console.log('');

        async.series([
            function filesForEach(callback){

                files.forEach(file => {
                    var urlImagem = 'https://cfwebapi.herokuapp.com/api/foto?na=' + file;
                    var img = { source: urlImagem, arquivo: file };

                    console.log('img');console.log(img);

                    todasImagens.push(img);
                });
                callback();
            }, 
            function retorna(callback){
                console.log('todasImagens');console.log(todasImagens);console.log('');
                callback();
            }
        ], 
        function(err) { 
            if (err != null) return res.status(500).send(err);

            res.render('imagens', { imagens: todasImagens });
        });
    });
});

app.get('/api/deletarImagem', function(req, res){

    var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var arquivo = req.query.arq;

    console.log('arquivo');
    console.log(arquivo);
    console.log('');


    var caminhoCompleto = __dirname + '/uploads/' + arquivo;
    console.log('caminhoCompleto');
    console.log(caminhoCompleto);

    fs.exists(caminhoCompleto, function(exists) {
        if(exists) {
            console.log('Arquivo encontrado. Deletando agora...');
            fs.unlink(caminhoCompleto);
            res.redirect('/imagens');
        } else {
            console.log('Arquivo não encontrado.');
        }
    });
})

app.get('/api/fetch', function (req, res) {

    res.send({ status: 'ok'});
});

// listen ======================================
app.listen(app.get('port'), function () {

    console.log('cf web api na porta', app.get('port'));
});
