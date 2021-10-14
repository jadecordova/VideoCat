const {
    titleCard,
    showCards
} = require('./utils');

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Finds and displays stars whose birthday conicides with the current day.
 * @param {object} $ - References object.
 */
function birthdays($) {
    $.content.innerHTML = '';
    $.content.appendChild(titleCard({
        icon: 'cake.png',
        title: 'Birthdays!',
        $
    }));
    const container = $.content.appendChild($.grid);
    showCards($, {
        elements: $.stars.filter(star => star.birthday),
        container
    });
}

//----------------------------------------------------------------------------------------------------------------------------------------
module.exports = {
    birthdays
}
