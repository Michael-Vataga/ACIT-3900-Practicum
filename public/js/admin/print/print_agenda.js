let agenda = document.getElementById('printDoc_agenda');

agenda.addEventListener('click', () => {
    let doc = new PDFDocument();
    let stream = doc.pipe(blobStream());
    let iframe = document.getElementById('iframePDF');
    let iframediv = document.getElementById('iframediv');

    console.log(iframediv);

    let array = [];
    let headers = [];

    $('#agendaTable th').each(function (index, item) {
        headers[index] = $(item).html();
    });

    $('#agendaTable tr').has('td').each(function () {
        let arrayItem = [];
        $('td', $(this)).each(function (index, item) {
            let string = $(item).html();
            if (index != 3){
                arrayItem[index] = string;
            }
        });
        array.push(arrayItem);
    });

    // string_array = JSON.stringify(array, undefined, 2);

    // console.log(string_array);
    console.log(array);

    doc.fontSize(25).text("Agenda", 60, 80)
        .font('Helvetica', 14)
        .moveDown()
        .text(headers.join("              "))
        .moveTo(60, 110)
        .lineTo(550, 110)
        .stroke()
        .moveDown()
        .font('Helvetica', 11);

    for (let i = 0; i < array.length; i++) {
        // let object = JSON.stringify(array[i], undefined, 2);
        // console.log(object);
        // object = object.replace(/{|}|"/g, '');
        // doc.text(object.values());
        
        let sub_array = array[i];
        let string = sub_array.join("                         ");

        doc.text(string).moveDown();
    }

    doc.end();
    stream.on('finish', function () {
        let url = stream.toBlobURL('application/pdf');

        iframediv.style = "display:block;";
        iframe.src = url;
    });
});