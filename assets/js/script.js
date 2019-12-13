$(document).ready(function() {
	// Auto-fill from the URL parameters
	var matches = window.location.href.match(/.+\?(.+)&?/);
	if(matches)
		$('.mcq-grid [name="mcqid"]').val(matches[1]);
	
	$('.mcq-grid').on('click', '.input', function() {
		// $(this).toggleClass('active');
		$(this).addClass('active');
		$(this).find('input').val($(this).hasClass('active') ? 1 : 0);
	});
	
	mcqdata = {
		// Default values
		subject_urls: null,
		nb_questions: 1,
		answers: [
			null, // 0 is not a question
			"AB"
		],
		score_valid: 2,
		score_invalid: -1
	};
	
	$('.mcq-grid').on('submit', function(e) {
		e.preventDefault();
		
		var $this = $(this);
		var $submit = $this.find('[type="submit"]');
		$submit.prop('disabled', true);
		$submit.html($('<i>').addClass('fas fa-spinner fa-spin fa-fw'));
		
		if(!$this.hasClass('loaded'))
		{
			var $mcqid = $this.find('[name="mcqid"]');
			var mcqid = $mcqid.val();
			
			// console.log(mcqid);
			
			$.getJSON(mcqid).done(function(data) {
				console.log(data);
				
				// Update mcqdata
				mcqdata.subject_urls = data.subject_urls;
				mcqdata.answers = data.answers;
				mcqdata.nb_questions = data.answers.length - 1;
				mcqdata.score_valid = data.score_valid;
				mcqdata.score_invalid = data.score_invalid;
				
				if(mcqdata.subject_urls)
				{
					$.each(mcqdata.subject_urls, function(key, value) {
						var $inputGroup = $('#subjectWrapper .input-group').clone();
						$inputGroup.find('.lang').html(key);
						$inputGroup.find('.btn').attr('href', value).html(value);
						console.log($inputGroup);
						$inputGroup.appendTo('.subject-box');
						$('.subject-box').show();
					});
				}
				
				var n = Math.ceil(mcqdata.nb_questions / 10);
				for(var i = 0; i < n; i++)
				{
					var $column = $('#columnTemplateWrapper .column').clone();
					$column.find('.index .label').map(function() {
						$(this).text(i * 10 + parseInt($(this).text()));
					});
					$column.insertBefore('.mcq-grid .submission-box');
				}
				
				$mcqid.prop('disabled', true);
				
				$this.addClass('loaded');
				$submit.toggleClass('btn-primary btn-success');
			}).fail(function() {
				alert('Error when fetching MCQ data');
			}).always(function() {
				$submit.prop('disabled', false);
				$submit.html($submit.hasClass('btn-primary') ? 'Load data' : 'Submit for results!');
			});
		}
		else
		{
			var score = 0;
			var count = 0;
			
			$this.find('.item').each(function() {
				var index = parseInt($(this).find('.index .label').text());
				
				var choices = ["", ""];
				$(this).find('.input').map(function(i) {
					var $input = $(this).find('input');
					if($input.val() != '0')
					{
						var name = $input.attr('name');
						choices[parseInt(name[2])] += name[1];
					}
				});
				
				var answer;
				if(choices[1] && choices[1] != 'ABCDE')
					answer = choices[1];
				else if(choices[0] && choices[0] != 'ABCDE')
					answer = choices[0];
				else
					answer = '';
				
				// Empty the cells
				$(this).find('.input').removeClass('active');
				$(this).find('.input input').val(0);
				
				// Fill inputs with user answers
				for(var i = 0; i <= answer.length; i++)
				{
					var $input = $(this).find('[name="q' + answer[i] + '0"]');
					$input.val(1);
					$input.parent().addClass('active');
				}
				
				var correction = typeof mcqdata.answers[index] != "undefined" ? mcqdata.answers[index] : "";
				
				// console.log(answer);
				// console.log(correction);
				// console.log(answer == correction);
				
				// Compare with correct answers
				if(answer == correction)
				{
					if(answer == '')
						return true; // Continue
					
					$(this).addClass('valid');
					score += mcqdata.score_valid;
					count++;
				}
				else
				{
					$(this).addClass('invalid');
					score += mcqdata.score_invalid;
					count++;
					
					// Fill second inputs with correct answers
					for(var i = 0; i <= correction.length; i++)
					{
						var $input = $(this).find('[name="q' + correction[i] + '1"]');
						$input.val(1);
						$input.parent().addClass('active');
					}
				}
			});
			
			var max_score = mcqdata.score_valid * count;
			var final_score = score / max_score * 20;
			$this.find('.score .full').html(score + ' / ' + max_score);
			$this.find('.score .final').html(final_score + ' / 20');
			$this.find('.score .final').removeClass('text-primary text-success text-warning text-danger');
			if(final_score >= 18)
				$this.find('.score .final').addClass('text-primary');
			else if(final_score >= 14)
				$this.find('.score .final').addClass('text-success');
			else if(final_score >= 8);
			else if(final_score >= 4)
				$this.find('.score .final').addClass('text-warning');
			else
				$this.find('.score .final').addClass('text-danger');
			$this.find('.score').show();
			
			$this.addClass('corrected');
			$submit.html($('<i>').addClass('fas fa-check fa-fw'));
		}
	});
	
	$('.mcq-grid').on('reset', function(e) {
		e.preventDefault();
		
		var $this = $(this);
		var $reset = $this.find('[type="reset"]');
		$reset.prop('disabled', true);
		$reset.html($('<i>').addClass('fas fa-spinner fa-spin fa-fw'));
		
		// Reset the form
		$this.find('.column').remove();
		$this.find('input').prop('disabled', false);
		$this.removeClass('loaded');
		
		var $subjectBox = $this.find('.subject-box');
		$subjectBox.hide();
		$subjectBox.find('.input-group').remove();
		
		$this.find('.score').hide();
		
		$reset.prop('disabled', false);
		$reset.html('Reset');
		
		var $submit = $this.find('[type="submit"]');
		$submit.prop('disabled', false);
		$submit.removeClass('btn-success').addClass('btn-primary');
		$submit.html('Load data');
	});
	
	$('.mcq-grid [type="submit"]').prop('disabled', false);
});
