$('form').on('submit', (e) => {
    window.location.href = "http://localhost:8080/login";
    e.preventDefault();

    const email = $('#email').val().trim();
    // const subject = $('#subject').val().trim();
    // const text = $('#text').val().trim();


    const data = {
        email
  
    };
        //   subject,
        // text

    $.post('/registerUser', data, function () {
        console.log('Server received the data');
    });
});;
