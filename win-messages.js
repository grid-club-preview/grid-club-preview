/* Grid Club winning statements · edit the phrases here.
 * Add or remove quoted phrases inside the arrays. Keep commas between items.
 * Upload this changed win-messages.js to the public GitHub repository to publish changes.
 * Avoid including names, secrets or private information.
 */
(function(root){
  'use strict';
  root.GridClubWinMessages = {
    dotTrails: {
    general: ['You did it!','No flies on you.','You knew the score.','We have a winner!',
      'Nice one.','Consider it connected.','All tied up nicely.','You’ve cracked it.',
      'And that’s a wrap!','Not a square out of place.','Look at you go.',
      'Another one bites the dust.','A tidy bit of connecting.','That’s all connected, then.',
      'That grid didn’t see you coming!','You’re good. Very good.','Step back. We have a winner!',
      'Winning!','How did you get so good?','The results are in…'],
    quick: ['Ooft. Quick draw!','Motoring through!','No hanging about, then.',
      'Blink and you’ll miss it.','Someone’s in a hurry.','A new personal best!'],
    effort: ['That one put up a fight.','Persistence pays off.','Got there in the end!',
      'A few detours, but who’s counting?','Never in doubt. Probably.'],
    clean: ['Nice and tidy.','No hint needed.','Smooth operator.','A neat piece of work.']
  },
    dotTrailsSpecial: {
      levelUp: 'Credit boosted!',
      grandFinale: 'Grand finale!',
      mastered: 'Dot Trails mastered!'
    },
    wordRescue: {
      general: ['Safe at last!','What a rescue!','What a relief!','Relief all round.',
        'Gridda lives another day.','Good wordin’.','What a hero.',
        'Words to the rescue!','A narrow escape!','And breathe.',
        'Quite the wordsmith.','Saved by the spell!'],
      raft: ['No shark meat today!','Hungry sharks today.','Not on the menu!',
        'No lunch for the shark.'],
      tide: ['High and dry!','You turned the tide.'],
      sinking: ['High and dry!','You turned the tide.','Not a letter too late!']
    },
    pipeShift: {
      general: [
        'Flow restored!',
        'Nicely connected.',
        'Let it flow!',
        'Pipes in perfect order.'
      ],
      stageHeading: 'Level {stage} complete!',
      stageVictory: 'Flow upgraded!',
      grandHeading: 'Pipe Shift mastered!',
      grandVictory: 'Every pipe connected!'
    }
  };
})(typeof globalThis!=='undefined'?globalThis:this);
