//ticketmaster key, skyscanner's key is included in fetch
var TMkey = "bKSSMopWAtNQDbL3YZCKcnZyqYR9rgHa"; //user: kevinkelbach
var searchBtn = $('#btn');

//copied and pasted from developer.ticketmaster
var getShows = (function(band){
    console.log("..fetching tour dates..");
    $.ajax({
        type:"GET",
        //modify url to include query search for 'keyword'
        url:"https://app.ticketmaster.com/discovery/v2/events?apikey="+TMkey+"&keyword="+band+"&locale=*&includeSpellcheck=yes",
        async:true,
        dataType: "json",
        success: function(json) {
                    console.log(json);
                    //execute display
                    displayShows(json);

                 },
        error: function(xhr, status, err) {
                    //maybe reword this alert
                    alert("There was an error");
                 }
      });
});

var displayShows = function(json) {
    console.log("rendering shows");
    
    //need to generate card for upcoming tour dates using for loop,
        
    for (var i = 0; i < 4; i++){
        
        var originPlace = $("#city-search").val().replace(/ /g, "+");
        var showDate = json._embedded.events[i].dates.start.localDate ;
        var destinationPlace = json._embedded.events[i]._embedded.venues[0].city.name ;
        //might need to expand destination into city,state,country which will require conditions since globally some states are null
        
        //min price, gotta make an if not-on-sale yet condition
        var ticketPrice = json._embedded.events[i].priceRanges[0].min ;
        
        

        console.log("current-city: "+originPlace);
        console.log("event date: "+showDate);
        console.log("destination: "+destinationPlace);
        console.log("tickets starting at: "+ticketPrice);
    

        
        //need to generate plane ticket prices
        getAirportCodes(originPlace, destinationPlace);
        getTickets(originPlace, destinationPlace, showDate);
    }

};


var getAirportCodes = function(cityName) {
    var apiUrl = "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/autosuggest/v1.0/UK/GBP/en-GB/?query=" + cityName;
    fetch(apiUrl, {
	"method": "GET",
	"headers": {
		"x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
		"x-rapidapi-key": "1658dcf10fmshdb341b964db1078p1016f2jsn3f3f02e49882"
	}
    })
    .then(response => {
        response.json().then(function (data) {
            console.log(data);
            console.log(data.Places[0].CityId);
        });
    })
    .catch(err => {
        console.error(err);
    });

};

var getTickets = function(originPlace, destinationPlace, showDate) {
    console.log("..generating airline prices from " + originPlace + " to " + destinationPlace + " with departure date of " + showDate + "..");

    // //skyscanner browse quotes fetch
    // fetch("https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browsequotes/v1.0/US/USD/en-US/"+originPlace+"/"+destinationPlace+"/"+showDate, {
    // 	"method": "GET",
    // 	"headers": {
    // 		"x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
    // 		//skyscanner apikey
    //         "x-rapidapi-key": "d574042440msh4cf8eb8f0390492p1e0f76jsn1523b9586d4c"
    // 	}
    // })

    var apiUrl = "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browsequotes/v1.0/US/USD/en-US/SFO-sky/JFK-sky/2021-11-01?inboundpartialdate=2021-12-01";

    fetch(apiUrl, {
	"method": "GET",
	"headers": {
		"x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
		"x-rapidapi-key": "1658dcf10fmshdb341b964db1078p1016f2jsn3f3f02e49882"
	}
    })
    .then(response => {
        response.json().then(function (data) {
            console.log(data);
            console.log(data.Quotes);
            console.log(data.Quotes.MinPrice);
            console.log(data.Quotes[0].MinPrice);
        });
    })
    .catch(err => {
        console.error(err);
    });
    
    
    // //if we use this we'll need to put the form in the HTML
    // //maybe use moment to generate a mini calendar
    // var outboundDate = $("#date").val() ;
    
    // //queryselect this one
    // var originPlace = $("#city-search").val().replace(/ /g, "+") ;
    

};




searchBtn.on("click", function(event) {
    event.preventDefault();
    var band = $('#band-search').val().replace(/ /g, "%20"); //regex to replace spaces with usable url symbols
    var city = $("#city-search").val().replace(/ /g, "+"); //this one might give us a hard time, we'll have to look up formatting for SS api
    
    if (band && city) {
        console.log("I want to see "+band+" and I am from "+city);
        getShows(band);
    } else {
        alert("Please enter the Musician and the City");
    }
});