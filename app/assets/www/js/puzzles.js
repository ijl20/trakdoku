// ********************************************************************************
// ********************************************************************************
// ************************* puzzles.html functions    ******************************
// ********************************************************************************
// ********************************************************************************

var puzzle_list_id = "";

// function called when puzzles.html loads
function on_loaded(puzzle_list, local_puzzles)
{
    puzzle_list_id = puzzle_list;
    add_scores(puzzle_list);
    local_load(local_puzzles);
}

// on_refresh() called if loaded page needs to be updated, e.g. in app on score change
function on_refresh()
{
    add_scores(puzzle_list_id);
}

// populate index.html with the list of puzzles saved in localStorage
function local_load(local_id)
{
    var puzzles = [];
    if (window.localStorage.length - 1)
    {
        for (var i = 0; i < window.localStorage.length; i++)
        {
            var key = window.localStorage.key(i);
            if (/puzzle:\d+/.test(key))
            {
                puzzles.push(window.localStorage.getItem(key));
            }
        }
        var local_div = document.getElementById(local_id);
        // Give up if we can't find the div to display the list
        if (!local_div)
        {
            alert("Can't find page element '"+local_id+"' for local puzzle list");
            return;
        }
        var local_ul = document.createElement('ul');
        local_div.appendChild(local_ul);
        for (var i=0;i<puzzles.length;i++)
        {
            var qs = parse_querystring(puzzles[i]);
            var local_li = document.createElement('li');
            local_ul.appendChild(local_li);
            var local_a = document.createElement('a');
            local_a.href = "javascript:load_puzzle('"+puzzles[i]+"')";
            local_a.innerHTML = qs.title;
            local_li.appendChild(local_a);
        }
    }
}

function add_scores(puzzle_links)
{
    var list = document.getElementById(puzzle_links);
    var items = list.getElementsByTagName("li");

    for (var i=0; i < items.length; i++)
    {
        var id = items[i].id.substring(7);
        var score_element = document.getElementById('score_'+id);
        var score = localStorage.getItem('score_'+id);
        if (!(score === null))
        {
            score_element.innerHTML = score; // embeds score % into link
            items[i].className = 'puzzle_links_item_solved'; // adds green highlight
        }
    }
    return;
}

//************************************************************************************
// Android-aware functions
//************************************************************************************

// Called from WebPageFragment.java when slider selects new page
function app_page_refresh(url)
{
    //alert('puzzles refresh');
    on_refresh();
}

// puzzles.html function to load puzzle into puzzle.html
function app_load_puzzle(querystring)
{
    //alert('com.forsterlewis.alert app_load_puzzle '+querystring);
    localStorage.setItem('querystring', querystring);
    // note 'alerts' are trapped in WebPageFragment.java, and interpreted as commands
    //alert('com.forsterlewis.next_page puzzle.html');
    app_next_page('puzzle.html');
}

