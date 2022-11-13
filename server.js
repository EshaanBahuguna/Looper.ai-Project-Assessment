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
    description: String, 
    issuedBy: String
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
    console.log(req.params)
    User.findById(req.params.userId.trim(), (err, foundUser)=>{
        if(!err){
            let userIssuedBooks = [], responseReady = false;
            
            if(foundUser.userInfo.issuedBooks.length === 0){
                responseReady = true;
            }
            for(let i = 0; i < foundUser.userInfo.issuedBooks.length; i++){
                Book.findById(foundUser.userInfo.issuedBooks[i]._id, (err, foundBook)=>{
                    if(!err){
                        console.log(foundBook.name);
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
                        if(i === foundUser.userInfo.issuedBooks.length-1){
                            responseReady = true;
                        }
                    }
                })
            }   
            setTimeout(()=>{
                if(responseReady){
                    res.json({issuedBooks: userIssuedBooks})
                }
            }, 1000);
        }
    })
})

app.get('/allBooks', (req, res)=>{
    Book.find({}, (err, foundBooks)=>{
        if(!err){
            let allBooks = [];

            // Converting buffer to base64 
            foundBooks.forEach((book)=>{
                allBooks.push({
                    details: {
                        _id: book._id,
                        name: book.name, 
                        description: book.description, 
                        issuedBy: book.issuedBy
                    }, 
                    image: {
                        data: book.image.toString('base64').trim(), 
                        type: book.type
                    }
                })
            })

            res.json({foundBooks: allBooks});
        }
    })
})

app.get('/getAllUsers/:userId', (req, res)=>{
    User.find({}, (err, foundUsers)=>{
        if(!err){
            let userIds = [];
            foundUsers.forEach((user)=>{
                if(String(user._id) !== req.params.userId){
                    userIds.push(user._id);
                }
            })

            res.json({userIds: userIds});
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

app.post('/addBook', upload.single('bookImage'), (req, res)=>{
    console.log(req.body, req.file);
    let bookImage = fs.readFileSync(__dirname + '/public/images/book image.jpg'),
        imageType = 'image/jpg';

    let error = false, message;
    
    if(req.body.bookname.length === 0 || req.body.description.length === 0){
        error = true;
        message = 'Name & Description for the book are mandatory'
    }
    if(req.file !== undefined){
        if(req.file.size / 1000000 >= 16){
            error = true;
            message = 'Image size should be less than 16 MB';
        }
        else{
            bookImage = req.file.buffer;
            imageType = req.file.mimetype;
        }   
    }
    
    if(!error){
        // Save Book Details to DB
        const newBook = new Book({
            name: req.body.bookname, 
            description: req.body.description, 
            image: bookImage, 
            type: imageType, 
            issuedBy: null
        });
        newBook.save((err)=>{
            if(!err){
                console.log('New Book was added to DB');
            }
        })
    }
    
    console.log("Error:" + error);
    res.json({error: error, message: message});
})

app.post('/issueBook/:userId', (req, res)=>{
    // Update issued-by field for the book
    Book.findByIdAndUpdate(req.body.bookId.trim(), {$set: {issuedBy: req.params.userId}}, (err)=>{
        if(!err){
            console.log('Book: ' + req.body.bookId + " issued by: " + req.params.userId);
            // Pushing book-id to issued-books field
            User.findByIdAndUpdate(req.params.userId, {$push: {"userInfo.issuedBooks": {_id: req.body.bookId.trim()}}}, (error)=>{
                if(!error){
                    console.log('Book added to issued-books');
                    res.json({issued: true});
                }
            })
        }
    })
})

app.post('/returnBook/:userId', (req, res)=>{
    // Remove book from issued-books field
    User.findByIdAndUpdate(req.params.userId.trim(), {$pull: {"userInfo.issuedBooks": {_id: req.body.bookId}}},(err)=>{
        if(!err){
            console.log('book: ' + req.body.bookId + " removed from user: " + req.params.userId);
            //Update issued-by field for the book
            Book.findByIdAndUpdate(req.body.bookId, {$set: {issuedBy: null}}, (error)=>{
                if(!error){
                    console.log('Book issued-by set to null');
                    res.json({removed: true});
                }
            })
        }
    })
})

app.post('/deleteUser', (req, res)=>{
    User.findByIdAndDelete(req.body.userId, (err, foundUser)=>{
        if(!err && foundUser !== null){
            console.log('user ' + req.body.userId + ' deleted from DB');
            res.json({deleted: true, userId: req.body.userId});
        }
    })
})

app.post('/deleteBook', (req, res)=>{
    console.log(req.body);
    Book.findByIdAndDelete(req.body.bookId, (err, foundUser)=>{
        if(!err && foundUser !== null){
            console.log('Book ' + req.body.bookId + ' deleted from DB');
            res.json({deleted: true});
        }
    })
})

app.listen(3000, ()=>{
    console.log('The server is running on PORT 3000');
})