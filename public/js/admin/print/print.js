let element = document.getElementById('printDoc');

element.addEventListener('click', () => {
    let doc = new PDFDocument();
    let stream = doc.pipe(blobStream());
    let iframe = document.getElementById('iframePDF');
    let iframediv = document.getElementById('iframediv');

    let eventName = document.getElementsByTagName('h1')[0].textContent;
    let eventDate = 'Event ' + document.getElementById('eventDate').textContent;
    let eventDesc = document.getElementById('eventDesc').textContent;
    let eventCount = document.getElementById('eventCount').textContent;

    var array = [];
    var headers = [];
    $('#attendeeTable th').each(function (index, item) {
        headers[index] = $(item).html();
    });
    $('#attendeeTable tr').has('td').each(function () {
        var arrayItem = {};
        $('td', $(this)).each(function (index, item) {
            let string = $(item).html();
            let pattern = /<form(.|\s)*<\/form>/;
            let email_pattern = />.*@\w*.\w*/;
            let new_string = '';

            if (string.match(pattern) != null){
                new_string = string.match(pattern);
            }
            else if (string.match(email_pattern) != null && string.includes("@")){
                new_string = string.match(email_pattern)[0];
                new_string = new_string.replace(/>/g, '');
                arrayItem[headers[index]] = new_string;
            }
            else {
                new_string = string;
                arrayItem[headers[index]] = new_string;
            }

        });
        array.push(arrayItem);
    });

    string_array = JSON.stringify(array, undefined, 2);
    

    doc.fontSize(25).text(eventName, 60, 80)
        .font('Helvetica', 11)
        .moveDown()
        .text(eventDate)
        .moveDown()
        .text(eventDesc, {
            width: 500,
            align: 'justify',
            height: 300,
            ellipsis: true
        })
        .moveDown()
        .text(eventCount)
        .moveDown()
        .fontSize(18).text('Attendees')
        .fontSize(11);

        for (let i = 0; i < array.length; i++) {
            let object = JSON.stringify(array[i], undefined, 2);
            console.log(object);
            object = object.replace(/{|}|"/g, '');
            doc.text(object);
        }

    doc.end();
    stream.on('finish', function () {
        let url = stream.toBlobURL('application/pdf');

        iframediv.style = "display:block;";
        iframe.src = url;
    });
});