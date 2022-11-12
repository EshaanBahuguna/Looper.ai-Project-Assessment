const submitButton = document.querySelector('button[type="submit"]');

// Event listener
submitButton.addEventListener('click', (event)=>{
    event.preventDefault();

    const   formData = new FormData(document.querySelector('form'))
    
    // Client side validation 
    if(formData.get("email").length === 0){
        showAlertBox('No email address entered', 'red');
    }
    else if(formData.get('password').length === 0){
        showAlertBox("No password entered", 'red');
    }
    else if(formData.get("password") !== formData.get("checkPassword")){
        showAlertBox("Password's do not match", 'red');
    }
    else{
        // Check if account already exists
        console.log(formData);
        fetch(`/checkAccountExists/${formData.get("email")}`)
        .then(response => response.json())
        .then((response)=> {
            console.log(response);
            if(response.accountExists){
                console.log(response)
                showAlertBox('Account with the same email address already exists', 'red');
            }
            else{
                console.log('sending details for DB')
                fetch('/sign-up', {
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        firstname: formData.get('firstname'),
                        lastname: formData.get('lastname'),
                        mobileNumber: formData.get('mobileNumber'),
                        email: formData.get('email'),
                        password: formData.get('password'),
                        checkPassword: formData.get('checkPassword'),
                    })
                })
                .then(res => res.json())
                .then((res)=> {
                    showAlertBox(res.message, 'green');
                    setTimeout(()=>{
                        location.href = '/login';
                    }, 2500)
                })
            }
        })
    }
})

function showAlertBox(message, color){
    const alertBox = document.querySelector('#alert-box');

    alertBox.innerText = message;
    if(color === 'red'){
        alertBox.className = 'mt-4 alert alert-danger text-center';
    }
    else if(color === 'green'){
        alertBox.className = 'mt-4 alert alert-success text-center';
    }
    alertBox.style.display = 'block';

    // Hide alert box 
    setTimeout(()=>{
        alertBox.style.display = 'none';
    }, 2000);
}