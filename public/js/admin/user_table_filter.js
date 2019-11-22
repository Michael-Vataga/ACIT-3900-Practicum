filterUsers = () => {
    let filter = "plantClassification";
    let name = $(`input[name=${filter}]:checked`).prop('id') || '';

    $('.user_acount_table').hide();
    $(`.user_acount_table .${filter}:contains(${name})`).closest("td").parent().show();

    // Show all plantClassifications
    let radioValue = $(`input[type=radio][name=${filter}]:checked`).attr('id');

    if (radioValue == "all") {
        $('.user_acount_table').show();
    }
};

$('input[type="radio"]').change(filterUsers);
