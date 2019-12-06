$('form').on('submit', (e) => {

    // $('#comment').val('');

    // $('#messages').modal('hide');

    $('#messages').removeClass('hide').addClass('alert alert-success alert-dismissible').slideDown().show();
    $('#messages_content').html('<h4>Password reset link sent. The email will appear in your inbox shortly.</h4>');
    $('#modal').appendTo("body").modal('show');
    

    setTimeout(() => {
        window.location.reload();
    }, 5000);

    e.preventDefault();

    const email = $('#email').val().trim();
    // const subject = $('#subject').val().trim();
    // const text = $('#text').val().trim();


    const data = {
        email

    };
    //   subject,
    // text

    $.post('/resetpassword', data, function () {
        console.log('Server received the data');
    });
});;
