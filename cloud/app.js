
// These two lines are required to initialize Express in Cloud Code.
 express = require('express');
 parseExpressHttpsRedirect = require('parse-express-https-redirect');
 parseExpressCookieSession = require('parse-express-cookie-session');
 app = express();

app.use(parseExpressHttpsRedirect());
app.use(express.cookieParser('LA_20_SIGNING_KEY_SUPER_GAMA_MEGA_SECRETA'));
app.use(parseExpressCookieSession({ cookie: { maxAge: 3600000 } }));


// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/', function(req, res) {
  if (Parse.User.current()) {
      res.render('index', { message: req.params.hello});
  } else {
      res.redirect('/login');
  }
});

app.get('/login', function(req, res) {
  if (Parse.User.current()) {
    res.redirect('/');
  } else {
    res.render('login', {});
  }
});

app.post('/login', function(req, res) {
  console.log(req.body.username);
  Parse.User.logIn(req.body.username, req.body.password, {
    success: function(user) {
      console.log(user);
      res.redirect('/');
    },
    error: function(user, error) {
      console.log(error);
      res.redirect('/login');
    }
  });
});

app.get('/logout', function(req, res) {
  Parse.User.logOut();
  res.redirect('/');
});

// // Example reading from the request query string of an HTTP get request.
// app.get('/test', function(req, res) {
//   // GET http://example.parseapp.com/test?message=hello
//   res.send(req.query.message);
// });

// // Example reading from the request body of an HTTP post request.
// app.post('/test', function(req, res) {
//   // POST http://example.parseapp.com/test (with request body "message=hello")
//   res.send(req.body.message);
// });

// Attach the Express app to Cloud Code.
app.listen();
