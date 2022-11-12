const   submitButton = document.querySelector('button[type="submit"]'), 
        error = document.querySelector('#error');

// Event Listener
submitButton.addEventListener('click', (event)=>{
    event.preventDefault();

    const formData = new FormData(document.querySelector('form'));
    
    // Check if no Account exists
    fetch(`/getAccountDetails/${formData.get('email')}`)
    .then((response)=> response.json())
    .then((response)=>{
        // Redirect to sign-up page if no such account exists
        if(!response.accountExists){
            error.style.display = 'block';
            setTimeout(()=>{
                location.href = '/sign-up';
            }, 1000)
        }
        else{
            fetch('/login', {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: formData.get('email'), 
                    password: formData.get('password')
                })
            })
            .then(res => res.json())
            .then((res)=>{
                if(!res.loginStatus){
                    error.innerText = 'Password is incorrect';
                    error.style.display = 'block';
                    setTimeout(()=>{
                        error.style.display = 'none';
                    }, 1500)
                }  
                else{
                    location.href = '/home';
                }  
            })
        }
    })
})