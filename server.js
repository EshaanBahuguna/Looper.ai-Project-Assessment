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
        userImageType: String, 
        favouriteBooks: [
            {
                name: String
            }
        ],
        mobileNumber: Number,  
        issuedBooks: [
            {
                _id : String
            }
        ]
    }
})
const Book = mongoose.model('Book', {
    name: String, 
    image: Buffer, 
    type: String, 
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

app.get('/checkAccountExists/:email', (req, res)=>{
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

app.get('/home/:userId', (req, res)=>{
    User.findById(req.params.userId.trim(), (err, foundUser)=>{
        if(!err && foundUser !== null){
            res.render('home', {userDetails: foundUser.userInfo, userId: foundUser._id});
        }
    })
})

app.get('/loadUserImage/:userId', (req, res)=>{
    User.findById(req.params.userId.trim(), (err, foundUser)=>{
        if(!err){
            res.json({
                image: foundUser.userInfo.userImage.toString('base64'), 
                type: foundUser.userInfo.userImageType
            })
        }
    })
})

app.get('/getIssuedBooks/:userId', (req, res)=>{
    User.findById(req.params.userId.trim(), (err, foundUser)=>{
        if(!err){
            let userIssuedBooks = [];
            foundUser.userInfo.issuedBooks.forEach((bookId)=>{
                User.findById(bookId, (err, foundBook)=>{
                    if(!err){
                        userIssuedBooks.push({
                            details: {
                                _id: foundBook._id,
                                name: foundBook.name, 
                                description: foundBook.description
                            }, 
                            image: {
                                data: foundBook.image.toString('base64'), 
                                type: foundBook.type
                            }
                        })
                    }
                })
            })

            res.json({issuedBooks: userIssuedBooks});
        }
    })
})

// POST Requests
app.post('/login', (req, res)=>{
    User.findOne({"userCredentials.email": req.body.email}, (err, foundUser)=>{
        if(!err){
            bcrypt.compare(req.body.password, foundUser.userCredentials.password).then((result)=>{
                let userId;
                let loginStatus = false;
                if(result){
                    loginStatus = true;
                    userId = foundUser._id;
                }
                
                res.json({loginStatus: loginStatus, userId: userId});
            })
        }
    })

})

app.post('/sign-up', (req, res)=>{
    let userDetails = {
        userCredentials: {
            email: '', 
            password: ''
        }, 
        userInfo: {
            firstname: '---', 
            lastname: '---', 
            userImage: fs.readFileSync(__dirname + '/public/images/user image.png'), 
            userImageType: 'image/png',
            favouriteBooks: [], 
            issuedBooks: [], 
            issuedBooksNumber: 0,
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

app.post('/updateUserDetails/:userId', upload.single('userImage'), (req, res)=>{
    console.log(req.body, req.file);
    User.findById(req.params.userId.trim(), (err, foundUser)=>{
        if(!err){
            let error = false, userDetailsChanged = false;
           
            // Check for changes
            if(req.body.firstname.length !== 0){
                foundUser.userInfo.firstname = req.body.firstname;
            }
            if(req.body.lastname.length !== 0){
                foundUser.userInfo.lastname = req.body.lastname;
            }
            if(req.body.mobileNumber.length !== 0){
                if(req.body.mobileNumber.length === 10){
                    foundUser.userInfo.mobileNumber = req.body.mobileNumber;
                    userDetailsChanged = true;
                }
                else{
                    error = 'Mobile Number should be of 10 digits';
                }
            }
            if(req.body.favouriteBooks.length !== 0){
                const books = req.body.favouriteBooks.split(',');

                books.forEach((book)=>{
                    foundUser.userInfo.favouriteBooks.push({name: book});
                })
                userDetailsChanged = true;
            }
            if(req.body.firstname.length != 0 || req.body.lastname != 0){
                userDetailsChanged = true;
            }
            if(req.file !== undefined){
                if(req.file.size / 1000000 < 16){
                    foundUser.userInfo.userImage = req.file.buffer;
                    foundUser.userInfo.userImageType = req.file.mimetype;
                    userDetailsChanged = true;
                }
                else{
                    error = 'Image should be less than 16 MB';
                }
            }

            if(userDetailsChanged && !error){
                foundUser.save((err)=>{
                    if(!err){
                        console.log(`updated details for user: ${req.params.userId}`);
                    }
                })
            }

            res.json({error: error});
        }
    })
})
app.listen(3000, ()=>{
    console.log('The server is running on PORT 3000');
})