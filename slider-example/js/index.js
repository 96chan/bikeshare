$(document).ready(function() {
    $( "#slider" ).slider({
		min: 0,
		max: 10,
		step: 1,
		value: 0,
		slide: function( event, ui ) {
			$('#sliderVal').text(ui.value);
		}
    });

    $('#sliderVal').text(0);

    var timer = setInterval(increment, 1000);

	function increment() {
		var value = $('#slider').slider('value');
		var newval = value+1;
	   	$('#slider').slider("value", newval);
		$('#sliderVal').text(newval);
		if(newval == 10) {
			clearTimeout(timer);
		}
	}

	$('#control').click(function() {
		if($(this).attr('class') == 'pause') {
			$(this).attr('class', 'play');
			clearTimeout(timer);
		} else {
			$(this).attr('class', 'pause');
			timer = setInterval(increment, 1000);
		}
	});
});