
const season = 10;
const daySpan = [0,119]

const gameOut = false;
const dayOut = true;

const startingCoins = 10000
const maxBet = 1000
const betThreshold = 0.51
const underThresholdMultiplier = 0.0
const begBetting = false;





const fetch = require("node-fetch")

async function day(d,s){
    let dayGames = await fetch(`https://www.blaseball.com/database/games?season=${s}&day=${d}`)
    let day = []
    let games = await dayGames.json()
    for (const game of games) {
        let winner, looser, won, winningOdds;
        if(game.homeScore > game.awayScore){
            winner = game.homeTeamNickname
            looser = game.awayTeamNickname
            winningOdds = game.homeOdds
        } else {
            winner = game.homeTeamNickname
            looser = game.awayTeamNickname
            winningOdds = game.awayOdds
        }
        if(game.homeOdds > game.awayOdds && winner == game.homeTeamNickname){
            won = true;
        }
        else if(game.homeOdds < game.awayOdds && winner == game.awayTeamNickname){
            won = true
        }
        else won = false
        day.push({
            awayOdds: game.awayOdds,
            homeOdds: game.homeOdds,
            highOdds: game.awayOdds>game.homeOdds?game.awayOdds:game.homeOdds,
            winningOdds,
            winner,
            looser,
            day:d,
            won
        })
        day.sort((a,b)=>{
            if(a.winningOdds > b.winningOdds) return -1;
            if(a.winningOdds < b.winningOdds) return 1;
            return 0;
        })
    }
    return day
}

async function run(){
    let wallet = startingCoins
    let games = []
    for(let i = daySpan[0]; i < daySpan[1]; i++){
        games.push(day(i,season))
    }
    Promise.all(games).then((v)=>{
        v.forEach(d=>{
            if(dayOut || gameOut)console.log("Day:", d[0].day)
            let dayWallet = wallet
            for (const game of d) {
                if(wallet == 0 && begBetting) wallet += Math.floor((Math.random()*12)+3); //beg betting
                if(game.highOdds>betThreshold || begBetting) game.bet = Math.min(maxBet, wallet)
                else if(game.highOdds<betThreshold) game.bet = Math.min(Math.floor(maxBet*underThresholdMultiplier), wallet)
                else game.bet = 0
                wallet -= game.bet
                if(game.won) game.winnings = bet(game.winningOdds, game.bet)
                else game.winnings = 0
            }
            for (const game of d){
                wallet += game.winnings
            }
            if(gameOut)console.table(d,["winningOdds","won","bet","winnings"])
            if(dayOut){
                console.log("Start of day Wallet:", dayWallet)
                console.log("End of day Wallet",wallet)
                console.log("Day Winnings:",wallet-dayWallet);
                console.log("\n")
            }
        })
        console.log("Final betting results, Season",season+1,"Day",daySpan[0]+1,"to",daySpan[1]+1)
        console.log("Betting Threashold:", Math.floor(betThreshold*100),"%")
        console.log("Bet under Threashold:", Math.floor(underThresholdMultiplier*100),"%")
        console.log("Max Bet:", maxBet)
        console.log(!begBetting?"No Beg Betting":"Beg Betting Enabled")
        console.log("-----")
        console.log("Starting Wallet:", startingCoins)
        console.log("Final Wallet:", wallet)
        console.log("Total Winnings:", wallet-startingCoins)
    })
}

run()

function bet(odds, coins) {
    return 0.5 === odds
      ? Math.round(2 * coins)
      : odds < 0.5
      ? Math.round(coins * (2 + 555e-6 * Math.pow(100 * (0.5 - odds), 2.4135)))
      : Math.round(coins * (2 - 335e-6 * Math.pow(100 * (odds - 0.5), 2.045)));
  }