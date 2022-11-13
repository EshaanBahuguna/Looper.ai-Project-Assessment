const   userId = document.querySelector('#user-id').value, 
        outputSectionTitle = document.querySelector('#output-section h3'), 
        outputResult = document.querySelector('#output-results'), 
        updateDetailsButton = document.querySelector('#update-details-button'), 
        addBookButton = document.querySelector('#add-book-button'), 
        allBooksButton = document.querySelector('#all-books'), 
        userBooksButton = document.querySelector('#user-books');

loadUserImage();
loadUsersBooks();

// Event Listeners
updateDetailsButton.addEventListener('click', (event)=>{
    event.preventDefault();

    outputSectionTitle.innerText = 'Update Personal Details';
    updateDetailsButton.disabled = true;
    outputResult.innerHTML = '';
    outputResult.innerHTML += `
        <i class="fa-solid fa-xmark position-relative fa-2x" id="close-button" style="right: -920px; cursor: pointer"></i>
        <form style="grid-column-start: 1; grid-column-end: 4" method="post" enctype="multipart/form-data" action="/updateUserDetails/${userId}">
            <div class="container my-3 px-0">
                <div class="row">
                    <div class="col">
                        <label for="first-name" class="mb-2">First Name</label>
                        <input type="text" name="firstname" id="first-name" class="form-control">
                    </div>
                    <div class="col">
                        <label for="last-name" class="mb-2">Last Name</label>
                        <input type="text" name="lastname" id="last-name" class="form-control">
                    </div>
                </div>
            </div>
            <div class="mb-3 row">
                <div class="col">
                    <label for="mobile-number" class="mb-2">Mobile Number </label>
                    <input type="number" name="mobileNumber" id="mobile-number" class="form-control">
                </div>
                <div class="col">
                    <label for="user-image" class="mb-2">Upload Image <span class="fw-light fst-italic">(less than 16MB) </span></label> 
                    <input type="file" class="form-control" id="user-image" name="userImage" accept=".png, .jpeg, .jpg">    
                </div>
            </div>
            <div class="mb-3">
                <label for="favourite-books" class="mb-2">Favourite Books <span class="fw-light fst-italic">(seperated by commas) </span></label>
                <input type="text" name="favouriteBooks" id="favourite-books" class="form-control">
            </div>
            <div class="d-flex justify-content-center">
                <button type="submit" class="btn btn-success mx-auto" id="update-user-details">Update</button>
            </div>
        </form>
    `;

    // Event Listener for Update User Details Button
    document.querySelector('#update-user-details').addEventListener('click', (e)=>{
        e.preventDefault();

        const formData = new FormData(document.querySelector('#output-results form'));

        fetch(`/updateUserDetails/${userId}`, {
            method: 'POST', 
            body: formData
        })
        .then(response => response.json())
        .then((response)=>{
            if(!response.error){
                location.reload(true);
            }
            else{
                // Show Error & Creating Alert Dynamically 
                const div = createAlertBox(response.error);
                outputResult.appendChild(div);

                // Remove alert box
                setTimeout(()=>{
                    div.remove();
                }, 2000);
            }
        })
    })

    loadCancelButton();
})

addBookButton.addEventListener('click', (event)=>{
    event.preventDefault();

    addBookButton.disabled = true;
    outputSectionTitle.innerText = 'Add Book Details';
    outputResult.innerHTML = '';

    outputResult.innerHTML += `
        <i class="fa-solid fa-xmark position-relative fa-2x" id="close-button" style="right: -920px; top: 80px; cursor: pointer"></i>
        <div class="py-5 px-0 rounded" style="width: 100%; grid-column-start: 1; grid-column-end: 4; margin-top: 5rem;"> 
            <form class="container mb-3">
                <div class="row mb-4"> 
                    <div class="col">
                        <label for="name" class="mb-2">Name of the Book<span class="text-red mx-1">*</span></label>
                        <input type="text" name="bookname" id="book-name" class="form-control">
                    </div>
                    <div class="col">
                        <label for="book-image" class="mb-2">Image</label>
                        <input type="file" name="bookImage" id="book-image" class="form-control" accept=".jpeg, .jpg, .png">
                    </div>
                </div> 
                <div class="row mb-3 px-2">
                    <textarea class="form-control" id="description" name="description" style="height: 10rem" placeholder="Description"></textarea>
                </div>
                <div class="row px-2">
                    <button class="btn btn-primary" id="add-book-btn"> Add </button> 
                </div>
            </form>
        </div>
    `;

    // Event Listerner for sending book details to server
    document.querySelector('#add-book-btn').addEventListener('click', (e)=>{
        e.preventDefault();

        const formData = new FormData(document.querySelector('#output-results form'));

        fetch('/addBook', {
            method: 'POST', 
            body: formData
        })
        .then(response => response.json())
        .then((response)=>{
            console.log(response);
            let div
            if(response.error){
                div = createAlertBox(response.message);
            }
            else{
                div = createAlertBox('The Book was successfully added', 'green');
            }

            div.style.display = 'block';
            outputResult.appendChild(div);
            setTimeout(()=>{
                div.style.display = 'none';

                document.querySelector('#book-name').value = '';
                document.querySelector('#description').value = '';
            }, 2000);
        })
    })

    loadCancelButton();
})

allBooksButton.addEventListener('click', (event)=>{
    event.preventDefault();

    fetch('/allBooks')
    .then(response => response.json())
    .then((response)=>{
        outputResult.innerHTML = '';
        outputSectionTitle.innerText = 'All Books';

        response.foundBooks.forEach((book)=>{
            outputResult.innerHTML += `
                <div class="card mb-3 px-0" style="width: 18rem;">
                    <img src="data:${book.image.type};base64,${book.image.data}" class="card-img-top" style="height: 7rem">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <h6 class="card-title">${book.details.name}</h6>
                        <p class="card-text fw-light text-center">${book.details.description}</p>
                    </div>
                </div>
            `;

            // Check if book is checkout-out or not
            let button = document.createElement('button');
            if(book.details.issuedBy === null || book.details.issuedBy.length === 0){
                button.className = 'btn btn-primary issue-book'; 
                button.innerText = 'Issue Book';
                button.value = book.details._id;
            }
            else{
                button.className = 'btn btn-warning';
                button.innerText = 'Checked Out';
                button.disabled = true;
            }

            outputResult.lastElementChild.lastElementChild.appendChild(button);
        })

        // Event Delegation for Issue-Book Button
        outputResult.addEventListener('click', (event)=>{
            if(event.target.className.indexOf('issue-book') !== -1){
                fetch(`/issueBook/${userId}`, {
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify({bookId: event.target.value})
                })
                .then(res => res.json())
                .then((res)=>{
                    if(res.issued){
                       event.target.disabled = true;
                       event.target.className = 'btn btn-warning';
                       event.target.innerText = 'Issued'; 
                    }
                })
            }
        })
    })
})

userBooksButton.addEventListener('click', (event)=>{
    event.preventDefault();

    outputSectionTitle.innerText = 'My Books';
    outputResult.innerHTML = '';

    loadUsersBooks();
})

//Event Listener for close button
function loadCancelButton(){
    document.querySelector('#close-button').addEventListener('click', (event)=>{
        event.preventDefault();

        updateDetailsButton.disabled = false;
        addBookButton.disabled = false;
        loadUsersBooks();
    }) 
}

function createAlertBox(message, color){
    let div = document.createElement('div');
    if(color === 'red' || color === undefined){
        div.className = 'alert alert-danger mt-2 p-2 text-center';
    }
    else{
        div.className = 'alert alert-success mt-2 p-2 text-center';
    }
    div.style.gridColumnStart = 1;
    div.style.gridColumnEnd = 4;
    div.innerText = message;

    return div;
}

function loadUserImage(){
    fetch(`/loadUserImage/${userId}`)
    .then(response => response.json())
    .then((response)=>{
        let img = document.createElement('img');
        img.src = `data:${response.type};base64,${response.image}`;
        img.id = 'user-image';
        img.style.height = '15rem';
        img.style.width = '15rem';
        img.style.borderRadius = '50%';
        img.style.marginBottom = '2rem';
        
        const   userDetailsSection = document.querySelector('#user-details'), 
                name = document.querySelector('#user-details > h2');
        
        userDetailsSection.insertBefore(img, name);
    })
}

function loadUsersBooks(){
    fetch(`/getIssuedBooks/${userId}`)
    .then(response => response.json())
    .then((response)=>{
        console.log(response);
        outputSectionTitle.innerText = 'My Books';
        outputResult.innerHTML = '';

        // When no books are issued by the user
        if(response.issuedBooks.length === 0){
            outputResult.innerHTML += `
                <div class="text-center text-bg-light py-5 px-0 rounded" style="width: 100%; grid-column-start: 1; grid-column-end: 4; margin-top: 10rem;"> 
                    <i class="fa-solid fa-face-frown fa-4x" style="color: #d3d3d3"></i>
                    <p class="mt-4 fw-semibold fs-2" style="color: #d3d3d3"> No books issued </p> 
                </div>
            `;
        }
        else{
            response.issuedBooks.forEach((book)=>{
                outputResult.innerHTML += `
                    <div class="card mb-3 px-0" style="width: 18rem;">
                        <img class="card-img-top" style="height: 7rem" src="data:${book.image.type};base64,${book.image.data}">
                        <div class="card-body d-flex flex-column justify-content-center align-items-center">
                            <h6 class="card-title">${book.details.name}</h6>
                            <p class="card-text fw-light text-center">${book.details.description}</p>
                            <button class="btn btn-danger return-book-button" value="${book.details._id}">Return</button>
                        </div>
                    </div>
                `;
            })

            // Event Delegation for Return-Book-Button
            outputResult.addEventListener('click', (event)=>{
                if(event.target.className.indexOf("return-book-button") !== -1){
                    console.log(event.target.value, event.target);
                    fetch(`/returnBook/${userId}`, {
                        method: 'POST', 
                        headers: {'Content-Type': 'application/json'}, 
                        body: JSON.stringify({bookId: event.target.value})
                    })
                    .then(res => res.json())
                    .then((res)=>{
                        if(res.removed){
                            event.target.parentElement.parentElement.remove();
                        }
                    })
                }
            })
        }
    })
}

