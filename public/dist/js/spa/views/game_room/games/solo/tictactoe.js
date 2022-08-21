import Constructor from "../../../constructor.js";

const winning_combinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [2, 5, 8],
    [0, 3, 6],
    [1, 4, 7],
    [0, 4, 8],
    [2, 4, 6]
];

let player_moves = [];
let computer_moves = [];
let whose_turn = "";
let total_moves = 0;
let did_someone_win = false;

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.set_title("Solo Tic Tac Toe");
        navbar(null, false);
    }

    async before_render() {}

    async render() {
        return $(`
            <div>
                <div class="header-back">
                    <div class="header-back-icon" onclick="$.fn.go_back('/spa/game-room');">
                        <i class='bx bx-chevron-left'></i>
                    </div>
                    <p class="header-back-text">Play Solo Tic Tac Toe</p>
                </div>
                <div class="overlay ttt-overlay">
                    <div>Results</div>
                </div>
                <div class="ttt-turn">player's turn</div>
                <div id="ttt-solo" class="ttt-gameboard">
                    <div class="ttt-block ttt-firstrow" id="ttt-0">
                        <i class="bx bx-circle"></i>
                        <i class="bx bx-x"></i>
                    </div>
                    <div class="ttt-block ttt-firstrow" id="ttt-1">
                        <i class="bx bx-circle"></i>
                        <i class="bx bx-x"></i>
                    </div>
                    <div class="ttt-block ttt-firstrow" id="ttt-2">
                        <i class="bx bx-circle"></i>
                        <i class="bx bx-x"></i>
                    </div>
                    <div class="ttt-block" id="ttt-3">
                        <i class="bx bx-circle"></i>
                        <i class="bx bx-x"></i>
                    </div>
                    <div class="ttt-block" id="ttt-4">
                        <i class="bx bx-circle"></i>
                        <i class="bx bx-x"></i>
                    </div>
                    <div class="ttt-block" id="ttt-5">
                        <i class="bx bx-circle"></i>
                        <i class="bx bx-x"></i>
                    </div>
                    <div class="ttt-block ttt-thirdrow" id="ttt-6">
                        <i class="bx bx-circle"></i>
                        <i class="bx bx-x"></i>
                    </div>
                    <div class="ttt-block ttt-thirdrow" id="ttt-7">
                        <i class="bx bx-circle"></i>
                        <i class="bx bx-x"></i>
                    </div>
                    <div class="ttt-block ttt-thirdrow" id="ttt-8">
                        <i class="bx bx-circle"></i>
                        <i class="bx bx-x"></i>
                    </div>
                </div>
            </div>
        `).on('click', '.ttt-block', e => {
            if (!whose_turn || whose_turn === 'computer') return;
            let id = e.currentTarget.id.split('ttt-')[1];
            if (computer_moves.indexOf(Number(id)) !== -1 || player_moves.indexOf(Number(id)) !== -1) return;
            $(e.currentTarget).find('.bx-x').addClass('ttt-clicked');
            player_moves.push(Number(id));
            next_turn("computer", player_moves);
        });
    }

    async after_render() {
        reset_game();
    }
}

function play_game() {
    if (total_moves === 9 && !did_someone_win) display_result("It's a tie");
    else if (did_someone_win) setTimeout(() => reset_game(), 1500);
    else if (whose_turn === "player" || total_moves === 0) {
        /* do something */
    } else if (whose_turn === "computer") setTimeout(() => computer(), 400);
}

function computer() {
    let pick_ttt_move = null;
    let computer_potential_wins = winning_combinations.filter(array => array.filter(item => computer_moves.indexOf(item) > -1).length === 2);
    if (computer_potential_wins.length > 0) {
        computer_potential_wins.filter(array => array.filter(item => {
            if (computer_potential_wins.indexOf(item) === -1 && player_moves.indexOf(item) === -1 && computer_moves.indexOf(item) === -1)
                pick_ttt_move = item;
        }));
    }
    if (pick_ttt_move == null) {
        let player_potential_wins = winning_combinations.filter(array => array.filter(item => player_moves.indexOf(item) > -1).length === 2);
        if (player_potential_wins.length > 0) {
            player_potential_wins.filter(array => array.filter(item => {
                if (player_potential_wins.indexOf(item) === -1 && player_moves.indexOf(item) === -1 && computer_moves.indexOf(item) === -1)
                    pick_ttt_move = item;
            }));
        }
    }
    if (pick_ttt_move == null) {
        let potential_wins = winning_combinations.filter(array => array.some(item => player_moves.indexOf(item) === -1 && computer_moves.indexOf(item) === -1));
        if (potential_wins.length) {
            potential_wins.filter(array => array.filter(item => {
                if (potential_wins.indexOf(item) === -1 && player_moves.indexOf(item) === -1 && computer_moves.indexOf(item) === -1)
                    pick_ttt_move = item;
            }));
        }
    }
    if (pick_ttt_move == null) pick_ttt_move = pick_ttt_random_move();
    let picked_ttt_move = $(`#ttt-${pick_ttt_move}`);
    if (total_moves === 9 && !did_someone_win) return;
    picked_ttt_move.find('.bx-circle').addClass("ttt-clicked");
    computer_moves.push(Number(pick_ttt_move));
    next_turn("player", computer_moves);
}

function pick_ttt_random_move() {
    let random = Math.floor(Math.random() * 9);
    if (computer_moves.indexOf(Number(random)) !== -1 || player_moves.indexOf(Number(random)) !== -1) return pick_ttt_random_move();
    else return random;
}

function next_turn(opponent, whose_moves) {
    $('.ttt-turn').text(`${opponent}\'s turn`).css('background-color', opponent ==  'computer' ? '#fa7268' : '#07c');
    whose_turn = opponent;
    total_moves++;
    has_won(whose_moves, winning_combinations);
    play_game();
}

function has_won(moves, winning_combinations) {
    let found_results = winning_combinations.filter(array => array.filter(item => moves.indexOf(item) > -1).length === 3);
    if (found_results.length > 0) {
        if (whose_turn === "computer") display_result("You won");
        else if (whose_turn === "player") display_result("The computer has won");
        did_someone_win = true;
    }
}

function reset_game() {
    player_moves = [];
    computer_moves = [];
    whose_turn = Math.random() < 0.5 ? "computer" : "player";
    total_moves = 0;
    did_someone_win = false;
    shuffle_array(winning_combinations);
    for (let i = 0; i < winning_combinations.length; i++) {
        shuffle_array(winning_combinations[i]);
    }
    $('.ttt-overlay').hide();
    $('.ttt-clicked').removeClass('ttt-clicked')
    if (whose_turn == 'computer') {
        $('.ttt-turn').text(`computer\'s turn`).css('background-color', '#fa7268');
        computer();
    } else $('.ttt-turn').text(`player\'s turn`).css('background-color', '#07c');
}

function display_result(winning_message) {
    $('.ttt-overlay div').text(winning_message);
    $('.ttt-overlay').show();
    setTimeout(() => reset_game(), 1500);
}
