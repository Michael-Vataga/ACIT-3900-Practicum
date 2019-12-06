$('form').on('submit', (e) => {
    $('#messages').removeClass('hide').addClass('alert alert-success alert-dismissible').slideDown().show();
    $('#messages_content').html('<h4>Your inquiry has been sent. Please allow for 3-5 business days for our staff to reply.</h4>');
    $('#modal').modal('show');

    setTimeout(() => {
        window.location.reload();
    }, 5000);
    
    e.preventDefault();

    // const name = $('#name').val().trim();
    const email = $('#email').val().trim();
    const subject = $('#subject').val().trim();
    // const phone = $('#phone').val().trim();
    // const issue = $('#issue').val().trim();
    const text = $('#text').val().trim();


    const data = {
        // name,
        email,
        subject,
        // phone,
        // issue,
        text
    };

    $.post('/email', data, function () {
        console.log('Server received the data');
    });
});;
