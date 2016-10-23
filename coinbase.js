

/*
Edwin Mak
007633834
Midterm 1
*/

var request = require('superagent');
var json2csv = require('json2csv');
var fs = require('fs');
var csv = require('csv');
var CSVFILE__DEFAULT = "orders.csv";
var HEADERS_DEFAULT = ['Timestamp', 'type', 'amount', 'currency', 'rate']; 
var orders = [];
var repl = require("repl");
	
	function BUY(amount, currency){
	    processOrder(amount, currency, 'BUY');
	}

	function SELL(amount, currency){
		processOrder(amount, currency, 'SELL');
	}

	function Order(){
		json2csv({ data: orders, quotes:''}, function(err,csv){
			if(err)console.log(err);
			fs.writeFile(CSVFILE__DEFAULT, csv, function(err) {
			  if (err) throw err;
			});
			csv2console(CSVFILE__DEFAULT,HEADERS_DEFAULT);
		});
		

	}
	var csv2console = function(csvfile, headers) {
	    console.log("=== Current Orders ===");
	    var parser = csv.parse([{delimiter: ','}]); //create the parser
	    var first = true;
	    parser.on('readable',function(){
		    while(row = parser.read()) {
		    	if(first){
		    		first = false;
		    	}else{
			        var timestamp = row[0];
					var type = row[1];
					var amount = row[2];
					var currency = row[3];
					var rate = row[4];
					console.log(timestamp + ' : ' + type + ' ' + amount + currency + ' : UNFILLED')
				}
		     }
	    });
	   parser.on('error', function(err){

	     console.log(err.message);
	   });
	   
	   fs.createReadStream(csvfile).pipe(parser);//Open file as stream and pipe it to parser
		};


	function isValidAmount(amount){
	    return (typeof amount === 'number' && amount > 0 );
	}

	function getExchangeRate(currency, callback){ 
	 request
		.get('https://api.coinbase.com/v1/currencies/exchange_rates')
		.set('Accept', 'application/json')
		.query({format:'json'})
		.end(function(err, res){
		    if (err || !res.ok) {
		       console.log('No known exchange rate: ' + currency);
		    } else {

		       return callback(res.body);
		    }
	    });
	}

	function processOrder(amount, currency, type){
		if(!isValidAmount(amount)){
			return console.log('No amount specified');
	    }else{ 
	    	var rate;
	    	var output;
			if(typeof currency === 'undefined'){
				currency = "BTN";
				rate = "N/A";
				output = 'Order to ' + type + " "+ amount + " bitcoin queued";
				var time = new Date();
				//var utcTime = time.toUTCString();
				var orderJson = {
						"Timestamp": time, 
						"type"     : type, 
						"amount"   : amount, 
						"currency" : currency,
						"rate"     : rate
				};
				orders.push(orderJson);
				console.log(output);
			}else{
				getExchangeRate(currency, function(response){
					var string = currency.toLowerCase() + "_to_btc";
					var btcValue = "btc_to_" + currency.toLowerCase();
					if(typeof response[string] === 'undefined'){
						console.log("No known exchange rate for BTC/ "+ currency +". Order failed");
						return;
					}else{
						 rate = response[string];
						 btcValue = response[btcValue];
						 output = "Order to " + type + " "+ amount + " " + currency + " worth of BTC" 
						 + " queued @ " + btcValue + " BTC/" + currency +  "(" + rate + "BTC)";
						var time = new Date();
						//var utcTime = time.toUTCString();
						var orderJson = {
								"Timestamp": time, 
								"type"     : type, 
								"amount"   : amount, 
								"currency" : currency,
								"rate"     : rate
						};
						orders.push(orderJson);
						console.log(output);
					}

				});
			}
			
		}
	}

	exports.BUY = BUY;
	exports.SELL = SELL;
	exports.Order = Order;

	var local = repl.start({prompt: "coinbase> ", eval: myEval});

	function myEval(cmd, context, filename, callback) {
	  var cmd = cmd.slice(0,-1);
	  var commandArray = cmd.split(" ");
	  commandArray[1] = parseInt(commandArray[1]);
	  if(commandArray.length > 3){

	  	callback(new Error('wrong input'))
	  }
	  if(commandArray[0] == "BUY" ){
	  	BUY(commandArray[1], commandArray[2]);
	  }else if(commandArray[0] == "SELL"){
	  	SELL(commandArray[1],commandArray[2]);
	  }else if(commandArray[0] == "ORDERS"){
	  	Order();
	  }

	}
	
	
	
