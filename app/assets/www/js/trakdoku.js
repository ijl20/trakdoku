// TRAKDOKU
// Copyright, all rights reserved: Ian Lewis, Thriplow

// This JS contains the core functionality of Trakdoku

// The puzzle state is maintained in an HTML 'table' with the id of the element passed to this JS.

// The 'puzzle' table starts off empty (no rows or columns) and the JS builds the table as needed.

// The starting data for the puzzle table is:
// dimensions = [ Columns, Rows ] i.e. the size of the table in columns and rows
// targets = [Column targets, Row Targets] i.e. the counts necessary on each column or row
// fixed = [ cell, cell, cell, ... ] i.e. a list of cells to contain fixed track puzzle pieces

// The starting data can be passed in the querystring, or the same ascii version of the puzzle 
// data can be placed into a localStorage item 'querystring'.

// Each 'td' element contains an 'img', referred to as a 'cell' in this code, often coded into a
// JS object as { index, column, row }. The img element is given an id='cell_row_column' e.g.
// <img src='img/cells/NS_fixed.png' id='cell_4_3'/>

// 'index' reflects the direction of the respective track, e.g. the index 'NS' is used to represent
// a track segment running North-South, and the img.src will be 'img/cells/NS.png'.
// Puzzle cells can be 'fixed' (i.e. contain a piece of track the user cannot change) in which
// case the index will be of the format 'NS_fixed.png'.
// Note that an index will always have the ENSW in alphabetical order, i.e. NS is valid but SN is not.

// Background: I decided to write a 'Hello World' web app, and go through the complete cycle of
// installing the various Android app build tools and get a 'native' Android app registered in the
// Google play store.  While on holiday in Summer 2014, I thought of this 'trains puzzle' as
// suitable for HTML/JS, so it became that 'Hello World' application.

// GLOBALS

//debug
status_int = 0;

//var title = 'Temporary Title...'; // will be set by 'title' in querystring/localStorage

var puzzle_id;

var puzzle_width, puzzle_height; // set in setup(), updated with row+/- and col+/-

var puzzle_fixed = {}; // start, finish and list of fixed cells from querystring

var puzzle_total; // count of the TOTAL number of track pieces in solution (=sum of targets)

var puzzle_targets = [[],[]]; // column and row targets for current puzzle, loaded from querystring

var puzzle_counts = [[],[]]; // column and row counts (versus targets), updated each time player adds track

//debug
var puzzle_status; // element to display debug info on page

// Globals to accumulate the score, i.e. the number of times the player
// has changed a cell to try and solve the puzzle (lower is better).
// On completion of the puzzle, the score will be written to localStorage so it can
// be displayed next to the appropriate puzzle link in puzzles.html
var puzzle_moves;
var score_cell; // previous cell to be clicked, start with off puzzle...
var no_score; // flag used to prevent scoring if player views answer

// Stack of actions for undo
// Holds previous state of cell
// e.g. [[1,5,'EW'],...]
var undo_state;

// global boolean says whether page clicks are in 'erase' mode
// i.e. any cell containing a track will be reverted to 'blank'
var erase_mode;

// global boolean to determine whether we are in BUILD mode or not
var build_mode;

// global build toggle when converting track cells to fixed
var fixed_mode;

// global toggle saying we're displaying the answer (or not)
var answer_mode;
var puzzle_state; // this will store the puzzle state when 'answer' is clicked,
                  // so puzzle state can be restored when answer is not shown
                       
// Use smart ordering of cell images depending upon the pattern of surrounding cells
// When the user clicks on any cell, the 'track image' in that cell rotates through
// an appropriate sequence.  We vary the sequence according to the 'pattern' around
// that particular cell (e.g. if there is already a connection from a track to the North,
// and another to a track to the South, then it makes sense to offer the 'NS' track image
// first). All the user should notice is that track selection seems a bit more intelligent
// than a dumb simple fixed rotation.
var sequence = {};
    // Initialize global img sequence dictionary for each pattern of surrounding cells
    // This is the order the img's will be displayed for each surrounding pattern
    // It is only used to make the selection of img's 'more intelligent' i.e. the order
    // is in the context of the surrounding cells
sequence['']  = {'blank':'EN','EN':'NS','NS':'ES','ES':'EW','EW':'SW','SW':'NW','NW':'blank'};
sequence['E'] = {'blank':'EN','EN':'EW','EW':'ES','ES':'NS','NS':'NW','NW':'SW','SW':'blank'};
sequence['N'] = {'blank':'EN','EN':'NS','NS':'NW','NW':'EW','EW':'SW','SW':'ES','ES':'blank'};
sequence['S'] = {'blank':'ES','ES':'NS','NS':'SW','SW':'EW','EW':'EN','EN':'NW','NW':'blank'};
sequence['W'] = {'blank':'NW','NW':'EW','EW':'SW','SW':'NS','NS':'EN','EN':'ES','ES':'blank'};
sequence['EN'] = {'blank':'EN','EN':'EW','EW':'ES','ES':'NS','NS':'NW','NW':'SW','SW':'blank'};
sequence['ES'] = {'blank':'ES','ES':'NS','NS':'SW','SW':'EW','EW':'EN','EN':'NW','NW':'blank'};
sequence['EW'] = {'blank':'EW','EW':'EN','EN':'ES','ES':'NS','NS':'NW','NW':'SW','SW':'blank'};
sequence['NS'] = {'blank':'NS','NS':'EN','EN':'NW','NW':'EW','EW':'SW','SW':'ES','ES':'blank'};
sequence['NW'] = {'blank':'NW','NW':'EW','EW':'SW','SW':'NS','NS':'EN','EN':'ES','ES':'blank'};
sequence['SW'] = {'blank':'SW','SW':'NS','NS':'ES','ES':'EW','EW':'EN','EN':'NW','NW':'blank'};


//*****************************************************************************    
//*****************************************************************************    
//****************** PUZZLE  BUILD                  ***************************    
//*****************************************************************************    
//*****************************************************************************    

// This function is called when trakdoku.html is first loaded
// and populates the 'puzzle' <table> element with the
// puzzle found in the querystring (either the 'real' querystring
// or the copy in localstorage.getItem('querystring'))
function trakdoku_loaded(puzzle)
{
    puzzle_moves = 0;
    score_cell = {'col':-1, 'row':-1}; // previous cell to be clicked, start with off puzzle...
    no_score = false; // flag used to prevent scoring if player views answer
    undo_state = [];
    erase_mode = false;
    build_mode = false;
    fixed_mode = false;
    answer_mode = false;    // load setup values from querystring if available
    if (setup_querystring(puzzle, true))
        return;
    
    //alert("No puzzle to draw");
}

// load puzzle state from querystring and setup puzzle
function setup_querystring(puzzle, start)
{    
    var querystring = '';
    if (location.hash)
    {
        //alert('loading from querystring');
        querystring = location.hash.substr(2);
    } else
    {
        //alert('loading from localStorage');
        querystring = localStorage.getItem('querystring');
    }
    // in the absence of anything else, load INTRO #1
    if (!querystring)
    {
        querystring = 'id=17&author=ian&title=INTRO #1&dimensions=4-4&fixed=0-0-EW,3-3-EN&targets=1-1-1-4,4-1-1-1&tracks=1-0-EW,2-0-EW,3-0-SW,3-1-NS,3-2-NS&counts=1-1-1-4,4-1-1-1';
    }
    
    var s = parse_querystring(querystring);
    
    if (start)
    {
        setup(puzzle, s.title, s.dimensions, s.targets, s.fixed, []);
    } else
    {
        setup(puzzle, s.title, s.dimensions, s.targets, s.fixed, s.tracks);
    }
    // return true if puzzle setup successful
    return true;
}

// parse_querystring takes a string and returns an object containing appropriate javascript types
// representing the various elements of a puzzle
// E.g. dimensions=4-4&targets=1-2-3-4,4-3-2-1 goes to result = { 'dimensions':[4,4], 'targets':[[1,2,3,4],[4,3,2,1]] }
function parse_querystring(querystring)
{
     // sample querystring: 
    // ?dimensions=8-8&targets=5-1-1-7-6-1-3-3,2-2-5-3-2-4-5-4&fixed=0-6-6,0-3-2,3-0-3,3-4-2,4-6-5,7-5-4
    // dictionary to contain unparsed querystring values
    var result = {};
    var query_dict = {};
    
    result.dimensions = [8,8]; // e.g. [8,8]
    result.targets = []; // e.g. [[5,1,1,7,6,1,3,3],[2,2,5,3,2,4,5,4]] i.e. (columns, rows)
    result.fixed = []; // e.g. [[0,6,'NW'],[0,3,'NS'],[3,0,'ES'],[3,4,'EN']] i.e. [col, row, img_id]...
    result.tracks = []; // e.g. [[0,6,'NW'],[0,3,'NS'],[3,0,'ES'],[3,4,'EN']]
    
   // load querystring values into query_dict
    querystring.split("&").forEach(function(item) 
                                    { 
                                        parts = item.split("=");
                                        query_dict[parts[0]] = parts[1];
                                    });

    if (query_dict['id'])
    {
        result.id = query_dict['id'];
        //debug hack - need id when build mode
        puzzle_id = result.id;
    }

    result.title = document.title;
    if (query_dict['title'])
    {
        result.title = query_dict['title'];
        //document.title = result.title;
    }
    
    // convert query_dict ascii values into setup_dict integers etc
    // e.g. dimensions=8-8    
    if (query_dict['dimensions'])
    {
        var dims = query_dict['dimensions'].split("-");
        result.dimensions = [ parseInt(dims[0],10), parseInt(dims[1],10) ];
    }
    // e.g. targets=5-1-1-7-6-1-3-3,2-2-5-3-2-4-5-4
    if (query_dict['targets'])
    {
        var tars = query_dict['targets'].split(',');
        //alert('tars[1]='+tars[1]);
        // axes are tars[0]=cols, tars[1]=rows
        for (var axis=0;axis<2;axis++)
        {
            result.targets[axis] = [];
            tars[axis].split('-').forEach(function(target)
                                            {
                                                result.targets[axis].push(parseInt(target,10));
                                            });
        }
    }
    //alert('targets[1]='+targets[1].toString());
    
    // e.g. fixed=0-6-EN,0-3-SW,3-0-EW,3-4-ES,4-6-EN,7-5-NS
    if (query_dict['fixed'])
    {
        var q_fixed = query_dict['fixed'].split(',');
        for (var i=0;i<q_fixed.length;i++)
        {
            var col_row_index = q_fixed[i].split('-');
            result.fixed.push({ 'col': parseInt(col_row_index[0],10),
                         'row': parseInt(col_row_index[1],10),
                         'index': col_row_index[2] 
                       });
        }
    }
    
    // e.g. tracks=0-6-EN,0-3-SW,3-0-EW,3-4-ES,4-6-EN,7-5-NS
    if (query_dict['tracks'])
    {
        var q_tracks = query_dict['tracks'].split(',');
        for (var i=0;i<q_tracks.length;i++)
        {
            var col_row_index = q_tracks[i].split('-');
            result.tracks.push({ 'col': parseInt(col_row_index[0],10),
                         'row': parseInt(col_row_index[1],10),
                         'index': col_row_index[2] 
                       });
        }
    }
    
    return result;
}    

// set up the puzzle
// table is the element id of the table to be created
// dimensions is [WIDTH, HEIGHT]
// targets is [column targets, row targets] where each is array of ints
// layout is a list of [row, column, index] tuples for initial track layout
function setup(table, title, dimensions, targets, fixed, tracks)
{

    //alert('setup fixed='+JSON.stringify(fixed));
    //alert('setup tracks='+JSON.stringify(tracks));
    title_element = document.getElementById('title');
    if (build_mode)
    {
        var input = document.createElement('input');
        input.placeholder = "<choose a title>";
        input.id = 'build_title';
        document.title = 'Trakdoku Build mode';
        // remove existing title 
        while (title_element.firstChild) {
            title_element.removeChild(title_element.firstChild);
        }

        title_element.appendChild(input);
    }
    else
    {
        title_element.innerHTML = title;
        document.title = title;
    }
    
    init(table, dimensions[0], dimensions[1]);
    
    // INITIALIZE GLOBALS
    
    //debug
    puzzle_status = document.getElementById('status');
    //puzzle_status.innerHTML = 'status';
    
    // store width and height in globals, so we don't
    // have to re-calc from table each time...
    puzzle_width = dimensions[0];
    puzzle_height = dimensions[1];

    // update global puzzle_fixed, start, finish
    set_start_finish(fixed, dimensions);
    
    // update global puzzle_targets
    puzzle_targets = targets;
    
    // initialize puzzle_counts to zeroes
    puzzle_counts = [[],[]]; // columns, rows
    // columns
    for (var i=0; i<puzzle_width; i++)
    {
        puzzle_counts[0].push(0);
    }
    // rows
    for (var i=0; i<puzzle_height; i++)
    {
        puzzle_counts[1].push(0);
    }
    
    // total number of tracks in puzzle (for score %)
    puzzle_total = 0;
    
    // set up column targets for each column
    // Also accumulates puzzle_total (by summing col targets)
    for (var col=0;col<dimensions[0];col++)
    {
        var target = 0;
        if (targets[0] && targets[0][col])
        {        
            target = targets[0][col];
        }
        //alert('>'+target+'<');
        var el_col_target = document.getElementById('col_target_'+col);
        el_col_target.innerHTML = ''+target;
        // accumulate sum of targets into puzzle_total
        puzzle_total += target;
    }
    // set up row targets
    for (var row=0;row<dimensions[1];row++)
    {
        var target = 0;
        if (targets[1] && targets[1][row])
        {
            target = targets[1][row];
        }
        //alert('>'+target+'<');
        var el_row = document.getElementById('row_target_'+row);
        el_row.innerHTML = ''+target;
    }
    // set fixed cells (i.e. change from 'blank' to fixed)
    // And also makes final adjustment to puzzle_total by subtracting fixed cells
    for (var i=0;i<fixed.length;i++)
    {
        set_cell('blank', {'col':fixed[i].col, 'row':fixed[i].row, 'index':fixed[i].index+'_fixed'});
        // reduce puzzle_total (i.e. total number of tracks required) by count of fixed tracks
        puzzle_total--; //debug we need to mod this if we add fixed obstructions
    }
    // puzzle_total is now correct (frankly, I should have just calculated it on its own...
    
    // With a correct puzzle_total (and zero puzzle_moves) we can write score to page
    set_score();
    
    // apply tracks (i.e. change from 'blank' to track)
    for (var i=0;i<tracks.length;i++)
    {
        set_cell('blank', tracks[i]);
    }
}

// initialize the tracks table
// will update table 'puzzle' to have target and
// count elements plus the correct (WIDTH x HEIGHT)
// number of blank cells
function init(table, width, height)
{
    
    //alert('init '+width+','+height);
    // get puzzle table
    var t = document.getElementById(table);
    // remove any rows already in there...
    while (t.firstChild) {
        t.removeChild(t.firstChild);
    }
    var tbody = document.createElement('tbody');
    // add row of column targets
    add_target_row(tbody, width);
    // add row of column counts
    add_column_counts(tbody, width);
    // add each row of main map
    add_rows(tbody, width, 0, height-1);
    t.appendChild(tbody);
    
}

// append the 'targets' row to the table
// i.e. the top row
function add_target_row(t, width)
{
    var tr = document.createElement('tr');
    // create two empty top-left td elements as headers of row counts
    var td = document.createElement('td');
    var txt = document.createTextNode('\u00A0');
    td.appendChild(txt);
    td.className = 'row_counts_header';
    tr.appendChild(td);
    td = document.createElement('td');
    txt = document.createTextNode('\u00A0');
    td.appendChild(txt);
    td.className = 'row_counts_header';
    tr.appendChild(td);
    // add each column count element
    for (col=0;col<width;col++)
    {
        add_target(tr, 'col_target_'+col);
    }
    tr.className = 'row_header';
    t.appendChild(tr);
}

// append the 'column counts' row to the table
// i.e. this is the second row in the table
function add_column_counts(t, width)
{
    var tr = document.createElement('tr');
    // create two empty top-left td elements
    var td = document.createElement('td');
    var txt = document.createTextNode('\u00A0');
    td.appendChild(txt);
    td.className = 'row_counts_header';
    tr.appendChild(td);
    td = document.createElement('td');
    txt = document.createTextNode('\u00A0');
    td.appendChild(txt);
    td.className = 'row_counts_header';
    tr.appendChild(td);
    // add each column count element
    for (col=0;col<width;col++)
    {
        add_count(tr, 'col_count_'+col);
    }
    tr.className = 'row_header';
    t.appendChild(tr);
}

// append all the track cell rows to the table
// i.e. rows will be added to the 
// 'target row' and 'column counts' row
function add_rows(t, width, row_from, row_to)
{
    for (row=row_from;row<=row_to;row++)
    {
        var tr = document.createElement('tr');
        add_target(tr, 'row_target_'+row);
        add_count(tr, 'row_count_'+row);
        for (col=0;col<width;col++)
        {
            add_cell(tr, row, col);
        }
        t.appendChild(tr);
    }
}

// append a new img=blank track <td> cell into the current row
function add_cell(tr, row, col)
{
    var td = document.createElement('td');
    var img = document.createElement('img');
    img.src = 'img/cells/blank.png';
    img.id = 'cell_'+row+'_'+col;
    img.className = 'cell';
    img.onclick = function (x) { cell_clicked(x); };
    td.appendChild(img);
    tr.appendChild(td);
}

// add a td 'target count' element to a row
// i.e. forms topmost row and leftmost column
function add_target(tr, id)
{
    var td = document.createElement('td');
    td.id = id;
    td.className = 'target_count';
    var txt = document.createTextNode('0');
    td.appendChild(txt);
    tr.appendChild(td);
}

// add a td 'count' element to a row
function add_count(tr, id)
{
    var td = document.createElement('td');
    td.id = id;
    td.className = 'track_count';
    var txt = document.createTextNode('0');
    td.appendChild(txt);
    tr.appendChild(td);
}

// Set the puzzle_fixed global .cells, .start, .finish
function set_start_finish(cells, dimensions)
{
    // add cells list to 'puzzle_fixed' global
    puzzle_fixed.cells = cells;
    // scrub any existing start/finish cells
    delete puzzle_fixed.start;
    delete puzzle_fixed.finish;
    // iterate all the cells until you find the 'terminals' i.e. the ones that
    // run off the edge of the puzzle
    cells.forEach( function (cell)
    {
        var terminal = start_finish(cell, dimensions[0], dimensions[1]);
        if (terminal.test)
        {
            if ('start' in puzzle_fixed)
            {
                puzzle_fixed.finish = { 'cell':cell, 'exit':terminal.exit };
            } else
            {
                puzzle_fixed.start = { 'cell': cell, 'exit':terminal.exit };
            }
        }
    });
}

// return .test = true if fixed cell leads off the puzzle (i.e. is start/finish)
// and .exit = E|N|S|W i.e. the direction of the same track piece that runs INTO the puzzle
// e.g. cell {'col':0, 'row':3, index:'EW' } is a terminal in column 0, i.e. the West edge
// of the puzzle, and the track piece is 'EW', so the exit is to the East, i.e.
//   start_finish({'col':0, 'row':3, index:'EW' }, 5, 5)-> { 'test': true, 'exit': 'E' }
function start_finish(cell, width, height)
{
    if (cell.col == 0 && cell.index.indexOf('W') >= 0) return { 'test': true, 'exit': cell_exit(cell.index, 'W') };
    if (cell.col == (width-1) && cell.index.indexOf('E') >= 0) return { 'test': true, 'exit': cell_exit(cell.index, 'E') };
    if (cell.row == 0 && cell.index.indexOf('N') >= 0) return { 'test': true, 'exit': cell_exit(cell.index, 'N') };
    if (cell.row == (height-1) && cell.index.indexOf('S') >= 0) return { 'test': true, 'exit': cell_exit(cell.index, 'S') };
    return false;
    // that was easier than I thought... 
}

// return the 'exit' direction from a cell given a particular entrance
// e.g. cell_exit('NS','N') returns 'S'
function cell_exit(index, entrance)
{
    if (index == 'ENSW')
    {
        if (entrance == 'E') return 'W';
        if (entrance == 'N') return 'S';
        if (entrance == 'S') return 'N';
        if (entrance == 'W') return 'E';
    }
    if (index[0] == entrance) return index[1];
    if (index[1] == entrance) return index[0];
    // if we get here, the entrance does not apply to the current index
    return '';
}

//*****************************************************************************    
//*****************************************************************************    
//****************** USER SOLVING PUZZLE            ***************************    
//*****************************************************************************    
//*****************************************************************************    

// called when track img element is clicked
// Generally changes src of img to 'next' image (given current 'smart' sequence)
// or can change cell to blank or fixed depending on erase_mode or fixed_mode.
//
// This 'user click' is also when we check whether the puzzle has been solved.
function cell_clicked(e)
{
    //debug
    //puzzle_status.innerHTML = status_int++;
    //alert(e.target);
    var target = e.target ? e.target : e.srcElement;
    
    // get index of cell track img
    var index = get_index(target);
    
    //alert('current index is '+index);
    id = target.id;
    // img id is 'cell_Row_Column'
    // extract Row
    row = parseInt(id.substring(id.indexOf("_") + 1, id.lastIndexOf("_")),10);
    // extract Column
    col = parseInt(id.substring(id.lastIndexOf("_") + 1),10);

	var cell = { 'index': index, 'col': col, 'row': row};
	
	if (erase_mode)
	{
		erase_cell(cell);
	}
	else if (fixed_mode)
    {
        fix_cell(cell);
    }
    else
	{
        // increment the score if this cell was not clicked last
        score_inc(cell);
        // and set the cell to the next image
		next_img(cell);
	}
    // check for success
    //alert('calling solved()');
    var s = solved();
    if (s.success)
    {
        //alert('success!');
        save_score();
    }
    //alert('bck from solved()');

}

// Given a current cell {index, col, row},
// Rotate the 'index' to the next appropriate image e.g. NS->NW
function next_img(cell)
{
    //debug
    //puzzle_status.innerHTML = status_int++;
    //alert('next_img1');
    var cell_index = cell.index;
    //alert('cell_index is >'+cell_index+'<');
    var index_suffix = ''; // will add '_fixed' if appropriate
    // Only allow changes to fixed cells if we're in build mode
    if (cell.index.indexOf('fixed') >= 0) 
    {
        if (build_mode)
        {
            cell_index = cell.index.substring(0,2);
            //index_suffix = '_fixed';
        }
        else
        {
            return;
        }
    }
    
    // Get the 'pattern' of the ENSW surrounding cells
    var p = pattern(cell.col,cell.row);
    // e.g. p = {E:c, N:b, S:c, W:x} for East=connection, North=no connection, South=connection, West=off edge
    
    // Generate a 'sequence key' from that pattern, which will be used to select an appropriate sequence of indexes
    // E.g. {E:c, N:b, S:c, W:x} -> 'ES' ( current cell is connected to the East and South )
    var seq_key = '';
    if (p['E']=='c') seq_key += 'E';
    if (p['N']=='c') seq_key += 'N';
    if (p['S']=='c') seq_key += 'S';
    if (p['W']=='c') seq_key += 'W';
    // limit sequence key length to 2 chars (we currently only choose the sequence based on first two chars)
    if (seq_key.length > 2)
    {
        seq_key = seq_key.substring(0,2);
    }
    
    // Now choose the sequence based on key, i.e. sequence['NS'] = blank->NS->EN->NW->EW->SW->ES->blank
    // I.e. for a cell connected to the North and South, we're choosing 'NS' as the first index after 'blank'
    // but we still rotate through the others.
    s = sequence[seq_key];

    // choose next cell index from current sequence
    var index = s[cell_index];
    //alert('trying '+index);
    // skip forwards over 'illegal' cell indexes
	// Here we step through the intended sequence until we come to a sensible cell assignment
	// i.e. one that does not take us off the edge of the map or into a blocked cell
	// we loop until we get back to the original suggestion, so we don't infinite loop
    while (index != cell_index)
    {
        // Proposed index is i0->i1 e.g. N->S
        i0 = index.charAt(0);
        i1 = index.charAt(1);
        // if index doesn't go off map or is blocked, then accept and break loop
        if ( p[i0]!='x' && p[i0]!='t' && p[i1]!='x' && p[i1]!='t')
        {
            break;
        }
        // if we're in build mode and index runs into edge of map, then use fixed
        //alert('proposed index='+index+', p[i0,i1]='+p[i0]+p[i1]);
        if ( build_mode && ((p[i0]=='x') != (p[i1]=='x')) && ( p[i0]!='t' && p[i1]!='t'))
        {
            index_suffix = '_fixed';
            break;
        }
        // We didn't break, so this index is bad, so choose next
        index = s[index];
    }
    //alert('chose '+ index);
    // before we make change, push previous state so we can undo
    record_cell(cell);

    // Ah, finally. We've chosen an index, so set the cell
    set_cell(cell_index, { 'index':index+index_suffix, 'col': cell.col, 'row': cell.row });
}

// Increment the score each time a *new* cell is clicked.
// Multiple clicks on the same cell don't increment the score
function score_inc(cell)
{
    // do nothing if user still clicking same cell
    if (cell.col == score_cell.col && cell.row == score_cell.row)
    {
        return;
    }
    // otherwise increment the score and update the page
    puzzle_moves++;
    score_cell = cell;
    set_score();
}

// write the user score into the 'score' element on trakdoku.html
// E.g. "5/9" (5 moves out of a minimum 9) or "90%" (10 moves vs minimum 9)
function set_score()
{
    var score_element = document.getElementById('score'); // trakdoku.html element displaying score
    if (puzzle_moves < puzzle_total)
    {
        score_element.innerHTML = puzzle_moves+'/'+ puzzle_total ; 
    } else
    {
       score_element.innerHTML = get_score();
    }   
}

// return a string representing the score for the completed puzzle
function get_score()
{
    return Math.round(puzzle_total / puzzle_moves * 100)+'%' ; 
}

// save the current score to local storage if it is better than previous
function save_score()
{
    // do NOT save score if player has viewed answer
    if (no_score) return;
    var previous_score = localStorage.getItem('score_'+puzzle_id);
    var new_score = get_score();
    if ((previous_score === null) || (parseInt(new_score,10) > parseInt(previous_score,10)))
    {
        localStorage.setItem('score_'+puzzle_id, get_score());
    }
}

// 'erase' the current cell, i.e. set cell img to 'blank.png'
function erase_cell(cell)
{
	if (cell.index=='blank')
	{
		// if the cell is 'blank' then toggle out of erase mode and increment cell
		erase();
		next_img(cell);
	}
	else
	{
		// before we make change, push previous state so we can undo
		record_cell(cell);
		
		set_cell(cell.index, { 'index':'blank', 'col': cell.col, 'row': cell.row });
	}
}

// convert the current cell to a fixed piece (i.e. plant a station on existing track)
function fix_cell(cell)
{
	if (cell.index=='blank') return;
    
    // before we make change, push previous state so we can undo
    record_cell(cell);
		
    if (cell.index.indexOf('fixed') >= 0)
	{
        // existing cell is 'fixed' so un-fix, e.g. NS_fixed -> NS
        var new_index = cell.index.substring(0,2);
		set_cell(cell.index, { 'index': new_index, 'col': cell.col, 'row': cell.row });
	}
	else
	{
		// existing cell is not fixed, so fix, e.g. NS -> NS_fixed
        var new_index = cell.index + "_fixed";
		set_cell(cell.index, { 'index': new_index, 'col': cell.col, 'row': cell.row });
	}
}

// return index of img at current img element e
// e.g. <img src='img/cells/NE.png'/> will return 'NE'
function get_index(e)
{
    src = e.src;
    // src is '...../img/cells/N.png' where N is image number 0..6 (0=blank)
    // extract N as index
    return src.substring(src.lastIndexOf("/") + 1, src.lastIndexOf("."));
}

// This function is essential for planning the current move
// It presents a 'map' (i.e. pattern) of the ENSW cells surrounding current [col,row]
//
// Find pattern of surrounding cells for cell in row,col
// e.g. 'N' means there is one cell connecting from the North
// 'EN' means there is a connection to the East and the North
function pattern(col,row)
{
    // The basic technique is to look in the cell to the E/N/S/W
    // and see if it has an img that connects to the OPPOSITE direction we're looking
    // i.e. the current cell will have a connection to the WEST if the cell on the
    // left has a connection to the EAST (i.e. has an 'E' in the img index)
    
    // pattern will be {'E': ?, 'N': ?, 'S': ?, 'W': ? } with ? as
    //  uppercase C if there is a connection
    //  lowercase b if there is no connection to that side
    //  lowercase x if the cell on that side is off the edge of the map
    
    // row, col are ascii
    //r = parseInt(row, 10);
    //c = parseInt(col, 10);
    
    // accumulate pattern in p, then return
    var p = {};
    //find connection from E
    var neighbor = document.getElementById('cell_'+row+'_'+(col+1));
    if (neighbor)
        { 
            index = get_index(neighbor);
			if (index=='blank') p['E'] = 'b'; // blank
            else if (index.indexOf('W') >= 0) p['E'] = 'c'; //connects
            else p['E'] = 't'; // contains track
        }
    else  p['E'] = 'x'; // off edge
    //find connection from N
    neighbor = document.getElementById('cell_'+(row-1)+'_'+col);
    if (row != 0 && neighbor)
        { 
            index = get_index(neighbor);
			if (index=='blank') p['N'] = 'b'; // blank
            else if (index.indexOf('S') >= 0) p['N'] = 'c'; 
            else p['N'] = 't';
        }
    else p['N'] = 'x'; // off edge
        
    //find connection from S
    neighbor = document.getElementById('cell_'+(row+1)+'_'+col);
    if (neighbor)
        { 
            index = get_index(neighbor);
			if (index=='blank') p['S'] = 'b'; // blank
            else if (index.indexOf('N') >= 0) p['S'] = 'c'; 
            else p['S'] = 't';
        }
    else p['S'] = 'x'; // off edge
        
    //find connection from W
    neighbor = document.getElementById('cell_'+row+'_'+(col-1));
    if (col != 0 && neighbor)
        { 
            index = get_index(neighbor);
			if (index=='blank') p['W'] = 'b'; // blank
            else if (index.indexOf('E') >= 0) p['W'] = 'c'; 
            else p['W'] = 't';
        }
    else p['W'] = 'x'; // off edge
        
    //alert('pattern >'+JSON.stringify(p)+'<');
    return p;
}

// increment or decrement the row/column counts as a result of recent img change
// Counts are stored in global puzzle_counts
function update_counts(prev_index, cell)
{

    // processing only needed if  current cell has changed to/from blank
    // i.e. previous or next img index is blank (so counts for row/col should be updated)
	// This if condition is a bit 'clever' - it's an xor
	// We want to update the counts if cell changes FROM blank or TO blank but not BLANK to BLANK or TRACK to TRACK
    if ((prev_index == 'blank') == (cell.index == 'blank'))
    {
        // do nothing (cell change doesn't affect counts)
        return;
    }
    
    // OK, row/column counts for this cell need to be updated
    
    // get elements for row/col counts and targets
    var el_col_count = document.getElementById('col_count_'+cell.col);
    var el_col_target = document.getElementById('col_target_'+cell.col);
    var el_row_count = document.getElementById('row_count_'+cell.row);
    var el_row_target = document.getElementById('row_target_'+cell.row);
    
    // either increment or decrement counts based on to/from blank for this cell
    if (prev_index == 'blank')
    {
        puzzle_counts[0][cell.col]++;
        puzzle_counts[1][cell.row]++;
    } else {
        puzzle_counts[0][cell.col]--;
        puzzle_counts[1][cell.row]--;
    }
    
    // update counts on page
    el_col_count.innerHTML = puzzle_counts[0][cell.col];
    el_row_count.innerHTML = puzzle_counts[1][cell.row];
    
    // update styles if target hit/missed
    // row
    if (puzzle_counts[1][cell.row]==puzzle_targets[1][cell.row])
    {
        //el_row_count.className = 'target_met';
        //el_row_target.className = 'target_met';
        var cells = el_row_count.parentNode.childNodes;
        for (var i=0; i < cells.length; i++)
        {
            //alert('setting bg');
            cells[i].className = 'target_met';
        }
    } else {
        var cells = el_row_count.parentNode.childNodes;
        for (var i=0; i < cells.length; i++)
        {
            //alert('setting bg');
            cells[i].className = 'target_missed';
        }
    }
    // column
    if (puzzle_counts[0][cell.col]==puzzle_targets[0][cell.col])
    {
        var i = 0;
        var img = document.getElementById('cell_'+(i++)+'_'+cell.col)
        while (img)
        {
            var td = img.parentNode;
            td.className = 'target_met';
            img = document.getElementById('cell_'+(i++)+'_'+cell.col)
        }
        el_col_count.className = 'target_met';
        el_col_target.className = 'target_met';
    } else {
        var i = 0;
        var img = document.getElementById('cell_'+(i++)+'_'+cell.col)
        while (img)
        {
            var td = img.parentNode;
            td.className = 'target_missed';
            img = document.getElementById('cell_'+(i++)+'_'+cell.col)
        }
        el_col_count.className = 'track_count';
        el_col_target.className = 'target_missed';
    }
}

// set up a cell with the required img
// cell is {row, col, index}
function set_cell(prev_index, cell)
{
    //alert('set_cell '+JSON.stringify(cell));
    img = document.getElementById('cell_'+cell.row+'_'+cell.col);
    img.src = 'img/cells/'+cell.index+'.png';
    //if (cell.index.indexOf('fixed') >= 0)
    //{
    //    img.onclick = false;
    //}
    // update row and column counts
    update_counts(prev_index, cell);
}

// Boolean returns true if puzzle is solved
// Global 'puzzle_fixed' contains .cells (list of all fixed), .start ({start cell}, exit) and finish (same)
// Basic algorithm is to follow the cells from the start, check we get to the finish, check all counts are
// correct, and check we passed through all the fixed cells...
function solved()
{
    var success = false; // haven't succeeded yet, will update in loop
    var fail_reason;
    //debug
    //puzzle_status.innerHTML = status_int++;
    
    // easy quick check - do counts match targets?
    // cols
    for (var i=0;i<puzzle_width;i++)
    {
        if (puzzle_counts[0][i] != puzzle_targets[0][i])
        {
            //alert('col counts fail');
            return { 'success':false, 'reason': 'Your column counts do not match the targets' }
        }
    }
    // rows
    for (var i=0;i<puzzle_height;i++)
    {
        if (puzzle_counts[1][i] != puzzle_targets[1][i])
        {
            //alert('row counts fail');
            return { 'success':false, 'reason': 'Your row counts do not match the targets' }
        }
    }
    
    //debug
    //alert('solved1');
    var fixed_count = 1; // number of fixed cells we've traversed in solution (start cell = 1)
    var current_col = puzzle_fixed.start.cell.col;
    var current_row = puzzle_fixed.start.cell.row;
    var current_exit = puzzle_fixed.start.exit;
    var entrance;
    // iterate through connected cells, break at end or when finish reached
    while (true)
    {
        //debug
        //puzzle_status.innerHTML = current_col + ','+current_row;
        
        //alert('testing '+current_col+','+current_row);
        // check if we have reached finish
        if (current_col == puzzle_fixed.finish.cell.col && current_row == puzzle_fixed.finish.cell.row)
        {
            //debug
            //puzzle_status.innerHTML = current_col + ','+current_row+' = finish';
            // check we have passed through all the fixed cells
            if (fixed_count == puzzle_fixed.cells.length)
            {
                success = true; // woohoo!
            } else
            {
                fail_reason = 'You did not pass through all the fixed stations';
            }
            break;
        }
        //alert('heading '+current_exit);
        // calculate row/column of next cell (i.e. from 'exit' of current cell)
        if (current_exit == 'E') { current_col++; entrance = 'W';}
        else if (current_exit == 'N') { current_row--; entrance = 'S';}
        else if (current_exit == 'S') { current_row++; entrance = 'N';}
        else if (current_exit == 'W') { current_col--; entrance = 'E';}
        //alert('moving to '+current_col+','+current_row);
        // break if we've gone off the edge of the puzzle
        if (current_col < 0 || current_col >= puzzle_width || current_row < 0 || current_row >= puzzle_height)
        {
            fail_reason = 'You went off the edge of the puzzle';
            break;
        }
        //alert('getting next index');
        // get index of next cell
        neighbor = document.getElementById('cell_'+current_row+'_'+current_col);
        if (!neighbor) break;
        var index = get_index(neighbor);
        // if the next cell is blank, then fail
        if (index.indexOf('blank')>=0)
        {
            fail_reason = 'You did not complete the track';
            break;
        }
        // if the next cell is 'fixed' then increment the fixed count
        if (index.indexOf('fixed')>=0) fixed_count++;
        //alert('solved3 '+index);
        current_exit = cell_exit(index, entrance);
        if (current_exit=='')
        {
            return { 'success': false, 'reason': 'Your track is not complete' };
        }
        
        //alert('solved4 '+index);
    }
    //debug
    //alert('solved2');
    return { 'success': success, 'reason': fail_reason };
}

// ********************************************************************************
// ********************************************************************************
// ************************* SAVE/LOAD routines      ******************************
// ********************************************************************************
// ********************************************************************************

// return the querystring representing the current state of the puzzle
function get_state(puzzle)
{
    var puzzle = document.getElementById(puzzle);
    if (!puzzle) return '';
    var tbody = puzzle.firstChild;
    if (!tbody) return '';
    var rows = tbody.childNodes;
    if (!rows) return '';
    
    var q = {};
    q.dimensions = [0, rows.length-2]; // width is set properly when we iterate the rows
    q.targets = [[],[]]; // [[column targets], [row targets]]
    q.counts = [[],[]]; // [[column counts], [row counts]]
    q.fixed=[];
    q.tracks=[];
    q.title='';
    
    // accumulate fixed and tracks
    for (var row=0;row<q.dimensions[1];row++)
    {
        var cols = rows[row].childNodes;
        if (!cols) return '';
        // Set 'width' of puzzle
        q.dimensions[0] = cols.length-2;
        for (var col=0;col<q.dimensions[0];col++)
        {
            index = get_index(document.getElementById('cell_'+row+'_'+col));
            if (index!='blank')
            {
                if (index.indexOf('fixed')>=0)
                {
                    q.fixed.push({'col':col,'row':row,'index':index.substring(0,2)});
                }
                else
                {
                    q.tracks.push({'col':col,'row':row,'index':index});
                }
            }
        }
    }
    
    // calculate 'target' counts
    
    // Column targets
    for (var col=0;col<q.dimensions[0];col++)
    {
        var el_col_target = document.getElementById('col_target_'+col);
        q.targets[0].push(parseInt(el_col_target.innerHTML,10));
        var el_col_count = document.getElementById('col_count_'+col);
        q.counts[0].push(parseInt(el_col_count.innerHTML,10));
    }

    // Row targets
    for (var row=0;row<q.dimensions[1];row++)
    {
        var el_row_target = document.getElementById('row_target_'+row);
        q.targets[1].push(parseInt(el_row_target.innerHTML,10));
        var el_row_count = document.getElementById('row_count_'+row);
        q.counts[1].push(parseInt(el_row_count.innerHTML,10));
    }

    q.title = document.title;
    var t = document.getElementById('build_title');
    if (t)
    {
        q.title = t.value;
    }
    //alert('state='+JSON.stringify(q));
    return q;
}

// store the 'state' of the puzzle, i.e. the querystring needed to recreate it
function save_state(puzzle)
{
    var q = get_state(puzzle);
    save_puzzle(q);
    //window.location.href = 'index.html';
}

// store the current puzzle status in localStorage
function save_puzzle(q)
{
    var dimensions = q.dimensions[0]+'-'+q.dimensions[1];
    var fixed = '';
    var targets = '';
    var tracks = '';
    var counts = '';
    
    // convert q.fixed array to string
    for (var i=0;i<q.fixed.length;i++)
    {
        if (i!=0)
        {
            fixed = fixed + ',';
        }
        fixed = fixed + q.fixed[i].col+'-'+q.fixed[i].row+'-'+q.fixed[i].index;
    }
    // convert q.tracks array to string
    for (var i=0;i<q.tracks.length;i++)
    {
        if (i!=0)
        {
            tracks = tracks + ',';
        }
        tracks = tracks + q.tracks[i].col+'-'+q.tracks[i].row+'-'+q.tracks[i].index;
    }
    // targets - columns
    for (var i=0;i<q.targets[0].length;i++)
    {
        if (i!=0)
        {
            targets = targets + '-';
        }
        targets += q.targets[0][i];
    }
    targets = targets + ',';
    // targets - rows
    for (var i=0;i<q.targets[1].length;i++)
    {
        if (i!=0)
        {
            targets = targets + '-';
        }
        targets += q.targets[1][i];
    }
    // counts - columns
    for (var i=0;i<q.counts[0].length;i++)
    {
        if (i!=0)
        {
            counts = counts + '-';
        }
        counts += q.counts[0][i];
    }
    counts = counts + ',';
    // counts - columns
    for (var i=0;i<q.counts[1].length;i++)
    {
        if (i!=0)
        {
            counts = counts + '-';
        }
        counts += q.counts[1][i];
    }
    if (build_mode)
    {
        var querystring = 'title='+q.title+'&dimensions='+dimensions+'&fixed='+fixed+'&targets='+counts+'&tracks='+tracks+'&counts='+counts;
    } else 
    {
        var querystring = 'title='+q.title+'&dimensions='+dimensions+'&fixed='+fixed+'&targets='+targets+'&tracks='+tracks+'&counts='+counts;
    }
    //alert(querystring); return;
    var local_index = localStorage.getItem('puzzle:index');
    if (!local_index)
    {
        local_index = 0;
    }
    localStorage.setItem('puzzle:index', ++local_index);
    var index_link = '<li class="puzzle_links_item" id="puzzle_'+local_index+'">';
    index_link += '<a href="javascript:load_puzzle(';
    // swapping JS string quotes to " so we can embed '
    index_link += "'id="+local_index+"&author=ian&"+querystring+"');";
    // back to single quotes for JS...
    index_link += '">'+q.title+'<span id="score_'+local_index+'" class="score"></span></a></li>';
    puzzle_status.innerHTML = '<textarea cols="132" rows="10">'+index_link+'</textarea>';
    //localStorage.setItem('puzzle:'+local_index, querystring);
}

// ********************************************************************************
// ********************************************************************************
// ************************* Player UI callbacks     ******************************
// ********************************************************************************
// ********************************************************************************

// UNDO action by popping previous cell state off the 'undo_state' array
// and applying it using set_cell()
function undo()
{
    //alert('undo');
    var cell = undo_state.pop();
    if (cell)
    {
        img = document.getElementById('cell_'+cell.row+'_'+cell.col);
        prev_index = get_index(img);
        set_cell(prev_index, cell);
    }
    //alert('undo to ' + prior_state.col + '-' + prior_state.row + '-' + prior_state.index);
}

// Save the 'undo' state
// If multiple changes are made to the same cell, only save the most recent state
function record_cell(cell)
{
    undo_length = undo_state.length;
    //alert('save_state '+undo_length);
    
    // if current undo list is empty OR the last element refers to a different cell, just push new state
    if (undo_length == 0 || undo_state[undo_length-1].row != cell.row || undo_state[undo_length-1].col != cell.col)
    {
        //alert('save_state push');
        undo_state.push(cell);
    }
}

// toggle build_mode, initialize puzzle to all blank
function build(puzzle)
{
    var build_icon = document.getElementById('build_icon');
    var build_icons = document.getElementById('build_icons');
	// toggle icon on page
	if (build_mode)
	{
		build_icon.src = 'img/icons/build.png';
        build_icons.className = 'build_icons_hidden';
	} else {
		build_icon.src = 'img/icons/build_active.png';
        build_icons.className = 'build_icons';
	}
	// toggle build_mode
	build_mode = !build_mode;
	setup(puzzle, '<choose title>', [5,5], [[0,0,0,0,0],[0,0,0,0,0]], [], []);
}

// called on icon click - toggle 'erase_mode'
// cells clicked on will then revert to 'blank'
// erase_mode is exited by clicking icon or any blank cell
function erase()
{
	var img = document.getElementById('erase_icon');
	// toggle icon on page
	if (erase_mode)
	{
		img.src = 'img/icons/erase.png';
	} else {
		img.src = 'img/icons/erase_active.png';
	}
	// toggle erase_mode
	erase_mode = !erase_mode;
}

// called in icon click - toggle 'fixed_mode'
function fixed()
{
	var img = document.getElementById('fixed_icon');
	// toggle icon on page
	if (fixed_mode)
	{
		img.src = 'img/icons/fixed.png';
	} else {
		img.src = 'img/icons/fixed_active.png';
	}
	// toggle fixed_mode
    fixed_mode = !fixed_mode;
}

// reload puzzle with 'tracks' showing
// Will save current puzzle state beforehand, so it can be toggled back
function answer(puzzle)
{
    // Set flag to prevent score being saved if puzzle is completed
    no_score = true;

    var img = document.getElementById('answer_icon');
	// toggle icon on page
	if (answer_mode)
	{
		img.src = 'img/icons/answer.png';
	} else {
		img.src = 'img/icons/answer_active.png';
	}
	// toggle answer_mode
	answer_mode = !answer_mode;

    // reload setup values from querystring if available
    if (answer_mode)
    {
        puzzle_state = get_state(puzzle);
        //alert('saved '+puzzle_state.width);
        if (!setup_querystring(puzzle, false))
        {
            alert("No answer available");
        }
    }
    else
    {
        setup(puzzle, 
                puzzle_state.title, 
                puzzle_state.dimensions,
                puzzle_state.targets, 
                puzzle_state.fixed, 
                puzzle_state.tracks);
    }
}

// ADD ROW: dynamically add a row (of cells) to the puzzle table
//debug: these don't update the counts, so removing a row containing tracks leaves col counts wrong.
function row_plus(puzzle)
{
    // get puzzle table
    var t = document.getElementById(puzzle);
    var tbody = t.firstChild;
    if (!tbody) return;
    // all good, so add a new row of cells
    add_rows(tbody, puzzle_width, puzzle_height, puzzle_height);
    puzzle_height++;
    // also extend targets/counts globals
    puzzle_targets[1].push(0);
    puzzle_counts[1].push(0);
    //alert('puzz wid,height '+ puzzle_width + ','+puzzle_height+' puz targ='+JSON.stringify(puzzle_targets)+ 'puz coutns='+JSON.stringify(puzzle_counts));
}

// REMOVE ROW: remove the last row (of cells) of the puzzle table
function row_minus(puzzle)
{
    // get puzzle table
    var t = document.getElementById(puzzle);
    var row_count = t.rows.length;
    if (row_count && row_count > 3)
    {
        // if we have 2+ normal cell rows (i.e. row_count>3), delete last
        t.deleteRow(row_count-1);
        // update the global for puzzle height
        puzzle_height--;
        // also truncate targets/counts globals
        puzzle_targets[1].length = puzzle_height;
        puzzle_counts[1].length = puzzle_height;
        //alert('puzz wid,height '+ puzzle_width + ','+puzzle_height+' puz targ='+JSON.stringify(puzzle_targets)+ 'puz coutns='+JSON.stringify(puzzle_counts));
    }
}

// ADD COLUMN: add a column of target/count/cells to the puzzle table
// Note we have to append the target and count cells in the
// top two rows first, then append a cell to each puzzle row
function col_plus(puzzle)
{
    // get puzzle table
    var t = document.getElementById(puzzle);
    // check if we at least have the target/count top two rows
    var row_count = t.rows.length;
    if (row_count && row_count >= 2)
    {
        // all looks normal, append a new target and count
        add_target(t.rows[0], 'col_target_'+puzzle_width);
        add_count(t.rows[1], 'col_count_'+puzzle_width);
        // now iterate down the rows, appending a new cell to each
        for (var row=2; row<row_count; row++)
        {
            add_cell(t.rows[row], row-2, puzzle_width);
        }
        // don't forget to update the puzzle size global
        puzzle_width++;
        // also extend targets/counts globals
        puzzle_targets[0].push(0);
        puzzle_counts[0].push(0);
        //alert('puzz wid,height '+ puzzle_width + ','+puzzle_height+' puz targ='+JSON.stringify(puzzle_targets)+ 'puz coutns='+JSON.stringify(puzzle_counts));
    }
}

// REMOVE COLUMN
// This is simpler than 'add a column' as we can simply
// delete target/count/cells
function col_minus(puzzle)
{
    var rows = document.getElementById(puzzle).rows;
    if (!rows || rows < 3 || rows[0].cells.length < 4) return;
    // iterate the rows, removing last <td> from each row
	for (var i=0; i<rows.length; i++) 
    {
        rows[i].deleteCell(-1);
	}
    puzzle_width--;
    // also truncate targets/counts globals (odd js I admit, but kosher, apparently)
    puzzle_targets[0].length = puzzle_width;
    puzzle_counts[0].length = puzzle_width;
    //alert('puzz wid,height '+ puzzle_width + ','+puzzle_height+' puz targ='+JSON.stringify(puzzle_targets)+ 'puz coutns='+JSON.stringify(puzzle_counts));
}


//************************************************************************************
// Android-aware functions
//************************************************************************************

// JS function called on index.html to move user to new url
// Note this function is 'Android App'-aware, i.e. it has modified behaviour
// between the browser and app usages
function app_next_page(url)
{
    if (typeof window.Android != "undefined") {
        //alert(url);
        // safe to use the function
        // using 'alert' trap method (in WebPageFragment.java)
        alert('com.forsterlewis.next_page ' + url);
        // s = window.Android.next_page(url);
        //alert(s);
    }
    else
    {
        window.location.href = url;
    }
}

