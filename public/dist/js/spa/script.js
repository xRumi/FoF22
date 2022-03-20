// ---------------------- pmf -------------------

function decorate(){
    let new_count = document.getElementsByClassName('new_msg_count');
    for (var i=0; i<new_count.length; i++){
        if (new_count[i].innerHTML == "\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t") {
            new_count[i].style.display = "none";
        }
    }
}
// document.getElementById('text_input').onclick=function(){inputStyle()};
function inputStyle(){
    if (screen.width < 780) {
        console.log("working");
        var icon = document.querySelectorAll('#input_section img');
        for (var i = 0; i < 4; i++) {
            icon[i].style.display = "none";
        }
        document.getElementById("right_arrow").style.display = "block";
        document.getElementById("right_arrow").style.margin = "0"
    }
}
function inputStyle2(){
    var icon = document.querySelectorAll('#input_section img');
    for (var i = 0; i < 4; i++) {
        icon[i].style.display = "block";
    }	
    document.getElementById("right_arrow").style.display = "none";
}

// ---------------------- pmf -------------------