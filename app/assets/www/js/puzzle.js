// JS Functions called from puzzle.html

//************************************************************************************
// Android-aware functions
//************************************************************************************

// Called from WebPageFragment.java when slider selects new page
function app_page_refresh(url)
{
    var status = document.getElementById("status");
    trakdoku_loaded('puzzle');
    //status.innerHTML += "<br/>app_page_refresh";
    //alert('puzzle refresh');
}