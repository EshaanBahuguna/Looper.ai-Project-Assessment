const { response } = require('express');

require('dotenv').config();
const   express = require('express'), 
        app = express(),
        bodyParser = require('body-parser'), 
        mongoose = require('mongoose'), 
        multer = require('multer'), 
        bcrypt = require('bcrypt'), 
        fs = require('fs'); 

const saltRounds = 10;

app.set('view engine', 'ejs'); 
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json(['application/json']));

// Setting up mongoose
mongoose.connect(`mongodb+srv://Eshaan-Bahuguna:looper-project@cluster0.4ey2ouz.mongodb.net/Looper-Project?retryWrites=true&w=majority`);
const User = mongoose.model('User', {
    userCredentials: {
        email: String, 
        password: String
    },
    userInfo: {
        firstname: String, 
        lastname: String, 
        userImage: Buffer, 
        favouriteBooks: [
            {
                name: String
            }
        ],
        mobileNumber: Number, 
        issuedBooks: Number
    }
})
const Book = mongoose.model('Book', {
    name: String, 
    image: Buffer, 
    description: String
})

// Setting up multer
const upload = multer({storage: multer.memoryStorage()});

// GET Requests
app.get('/', (req, res)=>{
    res.redirect('/login');
})

app.get('/login', (req, res)=>{
    res.render('login');
})

app.get('/sign-up', (req, res)=>{
    res.render('sign-up');
})

app.get('/getAccountDetails/:email', (req, res)=>{
    User.findOne({"userCredentials.email": req.params.email}, (err, foundUser)=>{
        if(!err){
            let accountExists = false;
            if(foundUser !== null){
                accountExists = true;
            }   
            res.json({accountExists: accountExists});
        }
    })
})

app.get('/home', (req, res)=>{
    res.render('home');
})

// POST Requests
app.post('/login', (req, res)=>{
    User.findOne({"userCredentials.email": req.body.email}, (err, foundUser)=>{
        if(!err){
            bcrypt.compare(req.body.password, foundUser.userCredentials.password).then((result)=>{
                console.log(req.body, result);
                let loginStatus = false;
                if(result){
                    loginStatus = true;
                }
                
                res.json({loginStatus: loginStatus});
            })
        }
    })

})

app.post('/sign-up', upload.single('userId'), (req, res)=>{
    let userDetails = {
        userCredentials: {
            email: '', 
            password: ''
        }, 
        userInfo: {
            firstname: '---', 
            lastname: '---', 
            userImage: fs.readFileSync(__dirname + '/public/images/user image.png'), 
            issuedBooks: 0, 
            mobileNumber: null
        }
    }

    // Hashing & Salting the password before storing
    bcrypt.hash(req.body.password, saltRounds, (err, hash)=>{
        if(!err){
            userDetails.userCredentials.email = req.body.email; 
            userDetails.userCredentials.password = hash; 
            
            // Check for optional details
            if(req.body.firstname.length != 0 && req.body.lastname.length != 0){
                userDetails.userInfo.firstname = req.body.firstname; 
                userDetails.userInfo.lastname = req.body.lastname; 
            }
            if(req.file != undefined){
                userDetails.userInfo.userImage = req.file.buffer;
            }
            if(req.body.mobileNumber.length != 0){
                userDetails.userInfo.mobileNumber = req.body.mobileNumber;
            }
            
            // Save userDetails to DB
            const newUser = new User(userDetails);
            newUser.save((err)=>{
                if(!err){
                    console.log('User Details saved to DB');
                    res.json({message: 'Account successfully created'});
                }
            })
        }
    })

})

app.listen(3000, ()=>{
    console.log('The server is running on PORT 3000');
})