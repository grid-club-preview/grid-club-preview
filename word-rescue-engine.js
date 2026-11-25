/* Grid Club · Word Rescue alpha, independent offline puzzle engine.
   Common-word beta vocabulary: no network dictionary dependency. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.GridClubWordRescueEngine=api;
})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
// Curated common words, not an exhaustive dictionary. Expand before launch.
const groups=[
 'act add age ago aid aim air all and ant any ape apt arc are arm art ash ask ate awe axe bad bag ban bar bat bay bed bee beg bet bid big bin bit boa bog boo box boy bud bug bun bus but buy cab can cap car cat cod cog cop cow cry cub cup cut dad dam day den dew did die dig dim dip dog dot dry due dug ear eat eel egg ego elf elk elm end era eve eye fad fan far fat fed fee few fig fin fir fit fix flu fly foe fog for fox fry fun fur gap gas gel gem get gig gin god got gum gun gut guy gym had ham has hat hay hen her hey hid him hip his hit hog hop hot how hub hue hug hum hut ice icy ill ink inn ion ire ivy jab jam jar jaw jay jet job jog joy jug key kid kin kit lab lad lag lap law lay led leg let lid lie lip lit log lot low lug mad man map mat may men met mix mob mop mud mug mum nab nag nap net new nib nil nip nod nor not now nut oak oar oat odd off oil old one opt orb ore our out owl own pad pal pan par pat paw pay pea pen pep per pet pew pie pig pin pip pit pod pop pot pry pub pug pun pup put rag ram ran rap rat raw ray red ref rep rib rid rig rim rip rob rod rot row rub rug rum run rye sad sag sap sat saw say sea see set sew she shy sip sir sit six ski sky sly sob sod son sop sow spa spy sub sue sum sun sup tab tag tan tap tar tax tea tee ten the thy tic tie tin tip toe ton too top tot tow toy try tub tug two urn use van vat vet vex via vie vim vow wad wag wan war was wax way web wed wee wet who why wig win wit won woo wow yak yam yap yaw yea yes yet yew yin zip zoo',
 'able ache acid acre acts adds aged ages airy alas ally also amen amid ammo anew anti apex aqua arch area arms army arts atom aunt auto away axle baby back bail bait bake bald bale ball balm band bang bank bark barn base bash bass bath beam bean bear beat beef been beep beer bell belt bend bent best beta bias bike bill bind bird bite bits blab blob blow blue blur boat body boil bold bolt bomb bond bone book boom boot bore born boss both bowl boys brag bran bred brew brie brim brow buck buff bulb bulk bull bump bunk burn bush busy buzz byte cake calf call calm came camp cane cape card care cart case cash cast cats cave cell cent chat chef chew chin chip chop chow city clad clam clap claw clay clip clog club clue coal coat code coil coin coke cold colt comb come cone cook cool coop cope copy cord core cork corn cost cosy coup cove crab cram crew crop crow cube curb cure curl cute cyan dale dame damp dare dark dart dash data date dawn days dead deaf deal dean dear debt deck deed deep deer defy deli demo dent desk dial dice diet dime dine dirt dish disk dive dock does doll dome done doom door dose down draw drew drip drop drum duck dude duel dull dune dusk dust duty each earn ease east easy echo edge edit else envy epic even ever exam exit face fact fade fail fair fake fall fame fang farm fast fate fear feed feel feet fell felt fend fern file fill film find fine fire firm fish fist five flag flap flat flaw flea fled flee flew flex flip flop flow foam foil fold folk food fool foot ford fork form fort foul four free fret frog from fuel full fund funk furl fury fuse gain gala gale game gang gape gasp gate gave gear geek germ gift girl give glad glam glow glue goal goat gold golf gone good gore gown grab grad gram gray grew grey grid grim grin grip grit grow grub gulf gull gulp gums gust guts guys gyro hail hair half hall halt hand hang hard hare harm harp hash hate haul have haze head heal heap hear heat heck heed heel heir held helm help herb herd hero hide high hike hill hint hire hive hold hole holy home hood hook hope horn hose host hour howl huge hull hump hung hunt hurt hush hype icon idea idle inch info into iris iron isle itch item jack jade jail jazz jean jerk jest jets join joke jolt juke jump junk jury just keen keep kept kick kids kill kiln kind king kiss kite knee knew knit knob knot know lace lack lady laid lake lamb lame lamp land lane last late lava lawn lazy lead leaf leak lean leap left lens lent less liar lice lick life lift like limb lime limp line link lion lips list live load loaf loan lobe lock loft logo lone long look loom loop lord lose loss lost loud love luck lump lung lure lush lust made mail main make male mall malt many maps mark mask mass mast mate math maze meal mean meat meek meet melt memo menu mere mesh mess mice mild mile milk mill mind mine mint miss mist mite mode mole monk mood moon moor more moss most moth move much mule muse must myth nail name navy near neat neck need nest news next nice nick nine node none nook norm nose note noun obey odds okay once only onto open oral oval oven over pace pack page paid pain pair pale palm pane pant park part pass past path pave pawn peak pear peat peck peel peer pelt perk pest pets pick pier pile pill pine pink pint pipe pity plan play plea plot plow plug plum plus poem poet poke pole poll pond pool poor pork port pose post pour pray prey prim prop prow pull pulp pump pure push quad quit quiz race rack rage raid rail rain rake ramp rang rank rare rash rate rave rays read real reap rear reed reef reel rein rely rent rest rice rich ride rife ring riot ripe rise risk rite road roam roar robe rock rode role roll roof room root rope rose rosy rota rote rubs ruby rude ruin rule rung rush rust safe sage sail sake sale salt same sand sane sang sank save scan scar seal seam seat seed seek seem seen seep self sell send sent serf sets sewn shed ship shoe shop shot show shut sick side sigh sign silk sill silo sing sink site size skid skim skin skip slab slam slap sled slid slim slip slit slow slug slum snap snow snug soak soap soar sock soda soft soil sold sole some song soon soot sore sort soul soup sour span spar spat spin spit spot spry spur star stay stem step stew stir stop stow stub stud stun such suck sued suit sulk sung sunk sure surf swam swap sway swim swum sync tack tail take tale talk tall tame tank tape tart task taxi team tear teen tell tend tent term test text than that thaw them then they thin this thou tick tide tidy tied tile till tilt time tiny tire toad toes told toll tomb tone tong took tool tops tore torn toss tour town trap tray tree trek trim trio trip true tube tuck tune turf turn twin type ugly undo unit upon used user uses vale vain vase vast veal vein vent verb very vest veto vibe vice view vine visa void vote wage wait wake walk wall wand want ward warm warn warp wash wasp wave ways weak wear weed week weep well went were west what when whip wide wife wild will wind wine wing wink wire wise wish with woke wolf wood wool word wore work worm worn wrap yard yarn yawn year yell yelp yoga yoke your zero zest zinc zone zoom',
 'about above actor adapt admit adult after again agent agree ahead alarm album alert alike alive allow alone along alter amber among ample angel angry ankle apple apply arena argue arise armed arrow aside asset atlas attic audio avoid awake award aware awful bacon badge bagel baker banks basic basil batch beach beans beard beast began begin being below bench berry birth black blade blame bland blank blast blaze bleed blend bless blind blink bliss block bloom blown blues bluff blunt board boast boats bonus books boost booth boots bored bound brain brake brand brass brave bread break breed brick bride brief bring broad broke brook brown brush build bunch burst buyer cabin cable camel candy canoe cargo carry carve cases catch cause chain chair chalk champ chant chaos charm chase cheap cheat check cheek cheer chess chest chief child chili chill chime china chirp choir choke chose chunk cider civil claim clamp clash class clean clear clerk click cliff climb cling cloak clock close cloth cloud clout clown clubs coach coast coats cocoa codes coins color comet comic coral couch cough could count court cover covet crack craft crane crash crate crave crawl crazy cream creek creep crest cried crime crisp croak cross crowd crown crude cruel crush crust cubes curve cycle daily dairy daisy dance dared dates dealt death debut decay decor delay delta dense depth devil diary digit diner dirty disco ditch diver dizzy dodge doing doubt dough dozen draft drain drama drank drawl drawn dread dream dress dried drift drink drive drone droop drops drove drown drums drunk dwarf dying eager eagle early earth ebony edges elbow elder elect elite email empty ended enjoy enter entry equal error erupt essay event every exact exile exist extra faced faces facts fairy faith false fancy farce farms fatal fault favor feast feats fence fever fiber field fiend fiery fifth fight filed files films final fines first fishy fixed flame flank flare flash flask fleet flesh flies fling float flock flood floor flora flour flows flush flyer focal focus foggy force forge forms forth forty found frame frank fraud fresh fried fries front frost fruit fully funny furry fuzzy gauge gears geese ghost giant gifts given glass glaze glide globe glory gloom gloss glove goals going goose gorge grace grade grain grand grant grape graph grasp grass grave great green greet grief grill grimy grind gripe groan groom gross group grove grown guard guess guest guide guild guilt guise gummy habit hairy halls handy happy hardy harsh haste hatch hated haven havoc heads heard heart heavy hedge heels hefty hello hence herbs hiked hills hilly hinge hints hippo hobby holds holes homes honey honor horse hotel house hover human humid humor hurry ideal ideas image imply inbox index inner input irony issue items ivory jeans jelly jewel joint joker jokes jolly judge juice juicy jumbo jumps keeps kayak knife knock known label labor laden lakes lamps large laser later laugh layer leads learn lease least leave legal lemon level lever light liked limit lines linen liner links lions lists lived liver local lodge logic loose loser lotus loves lower lucky lunch lungs lying magic major maker maple march marks marsh match mates maybe mayor meals medal media medic meets melon mercy merge merit merry metal meter miles mimic minds minor minty minus mixed model money month moods moose moral motor mount mouse mouth movie muddy music musty naive names nasty naval needs nerve never newly night ninja noble noise north noted notes novel nurse occur ocean offer often olive onion opens opera orbit order organ other ought ounce outer owner oxide ozone packs pages paint pairs panic paper parks party pasta paste patch patio pause peace peach peaks pearl pedal peeks penny perch perks phase phone photo piano piece pilot pinch pinky pipes pitch pizza place plain plane plank plans plant plate plays plaza plead pleas plots pluck plums plush point poise poker polar porch ports posed pound power press price pride prime print prior prize probe proof prose proud prove proxy prune pulse pumps punch pupil purse queen query quest queue quick quiet quilt quite quote radar radio rails rainy raise rally ranch range rapid ratio reach react reads ready realm recap relax relay reply reset retro retry rhyme rider rides ridge right rigid rings rinse risen rises rival river roads roast robot rocks rogue roles roman rooms roots rough round route rover royal rugby rules rural sadly safer saint salad sales salty sandy sauce scale scarf scary scene scent scope score scout scrap screw scrub scuff seals seams seats seeds seeks sells sends sense serve setup seven shade shady shake shall shame shape share shark sharp shave sheep sheer sheet shelf shell shift shine shiny ships shirt shock shoes shook shoot shops shore short shout shown shows shrub shrug sides sight sigma silly since sings sinks sinus sixth skate skill skins skirt skits skull slack slate slave sleep slice slide slime sling slope small smart smash smell smile smoke snack snail snake sneak sniff snore soaps solar solid solve songs sonic sorry sound south space spare spark speak speed spell spend spent spice spicy spill spine spite split spoil spoke spoon sport spots spray squad stack staff stage stain stair stake stale stand stare stark start state stays steam steel steep steer stems stick still sting stink stock stole stone stood stool store storm story stove strap straw stray strip stuck study stuff stump stunt style sugar suits sunny super surge sushi swear sweep sweet swell swept swift swing swipe sword sworn table tails taken takes tales talks tanks taste tasty teach teams tears tease teddy teeth tells tempo tends tense terms thank theft their theme there thick thief thigh thing think third thorn those three threw throw thumb tiger tight tiles timer tired tires title toast today token tools tooth topic torch total touch tough towel tower towns trace track trade trail train trait tramp trash treat trend trial tribe trick tried tries trips troll troop trout truck truly trunk trust truth tubes tulip turns tutor twice twist typed types uncle under union unity until upper upset urban usage users usual vague valid value valve vapor vault venue verbs verge verse video views villa vinyl viral virus visit vital vivid voice voter votes wagon waist wakes walks walls wants wards warns waste watch water watts waves waxed weary weave wedge weeks weird wells whale wheat wheel where which while white whole whose wider width winds windy wines wings wired wiser witch wives woman women woods words works world worms worry worse worst worth would wound wraps wrath wrist write wrong wrote yacht yards years yeast yield young youth yummy zebra zeros zones',
 'absent accept access across acting action active actors actual admire advice advise afford afraid agency agenda almost always amazed amount animal annual answer anyone appeal appear apples arcade arrive artist aspect assess assist assume attack autumn avenue bakery ballet bamboo banana banner barley barrel basket battle beauty become before behalf behave behind belief belong beside better beyond bicycle bishop bitter blanket blonde border bottle bottom bounce branch breath bridge bright broken bronze budget buffer bundle burger burden burial button buying camera cancel candle canvas carbon career carpet carrot castle casual cattle center centre chance change chapel charge cheese cherry choice choose chorus chosen circle circus cities client cliffs clinic closer clouds cloudy coach coastal coffee collar combat coming common comply copper corner cotton county couple course cousin craft create credit creepy cruise crunch crying cursor custom danger daring dealer debate decade decide defect defend define degree demand depart depend deploy desert design desire detail detect device dinner direct divide doctor dollar domain double dragon drawer dreams dreamy driver driven during duties easier easily eating editor effect effort eighty eleven emerge empire enable encode energy engine enough enrich ensure entity escape estate ethics except expand expect expert expire expose extend extras fabric facing factor failed fairly family famous farmer father fellow female fences ferret fierce figure filing filled filter finale finger finish fiscal fishes flight floral flower follow forest format formal former foster fourth fragile friend fringe frozen future galaxy garage garden garlic gather gentle ginger global golden golfer gossip govern grains grants grassy ground growth guilty guitar hammer handle happen harbor harden harder hardly hazard health hearts heated height helmet hidden higher hiking holder honest honour hopper horses hotels humble humour hunger hunter impact import impose income indeed indoor inform injury inline insane insect inside insist intact intake intent invest invite island jacket jungle junior keeper kernel kindly kitten ladder ladies lagoon landed larger latest launch lawyer leader league leaves legend length letter levels lifted lights likely listen little lively living locate locked locker lonely longer loudly lovely lumber magnet mainly manage manner manual marine market marble margin marker master matter meadow medium melody member memory mental mentor method middle mighty millet mining minute mirror mobile modern module moment monkey months mostly mother motion moving muscle museum mutual narrow nation native nature nearby nearly needed needle nested nether nicely nickel ninety normal notice number object obtain occupy oceanic office offline online option orange origin outlet output oxygen packet painter palace panels parent parsed partly people pepper period person phrase picnic pieces pirate planet player please plenty poetry points police polish policy portal poster potato powder praise prefer pretty prices prince prison prized proper public puzzle quartz rabbit racing random ranked rarely rather rating reader really reason recall recent record redeem reduce region relate remain remote remove render repeat replay rescue resist retail return reveal review reward ribbon riders rising rocket roller rooted rotate routes runner safety sailor salmon sample saving scenic school screen search season second secret sector secure select seller senior sensor series server settle shadow shaking shared sheets shelter shield shifts shooter shores should signal silent silver simple singly singer sister sketch sleepy slider slides slight slowed slower smooth socket solder solved solver sounds source sparse speech speedy spiral spirit stable stages stairs stands staple starts stated static status steam steady stereo sticky stolen stored stores stormy stream street stress string strong struck studio submit subset sudden suffer summer summit sunset supply surely survey sweets switch symbol system tablet target tasted tender tennis theory theirs things thirty though thread threat throat ticket timber timing tissue titles toggle tomato tongue toward towers travel trials tricky trigger trophy tunnel turkey turned twelve twenty typing unique united unless unlock update upload upside useful valley valued values vendor verify vessel viewer violet vision visual voices volume voting walker wallet wander wanted warmer washes wasted waters wealth weekly weight wheels whilst wholly wicket wicked window winner winter wishes within wizard wonder wooden worker worlds worthy writer yellow yields yogurt zombie'
];
const WORD_SET=new Set(groups.join(' ').toUpperCase().split(/\s+/).filter(w=>/^[A-Z]{3,7}$/.test(w)));
// Only known common nouns generate regular plurals. Blindly appending S to
// every dictionary word would admit non-words (e.g. pronouns or adjectives).
const PLURAL_NOUNS=(
 'act age animal ant apple arm artist ash aunt baby bag ball bank bar barn basket bat bear bed bee bell belt bench berry bird boat body book boot bottle box boy branch bread brick bridge brother brush bug bulb bull bun bus bush button cab cake camera camp candle cap car card cart castle cat cave chair chain chance change cherry chest child chip city class cliff clock cloud club coat coin collar comet comic cone cookie coral corner couch country cow crab craft crane crate cream creek crowd crown cup curve customer cycle daisy day deer desk device diary dish doctor dog doll door dot dragon dream dress drink drum duck duty ear edge egg elephant elf elbow engine eye face fact fairy family fan farm father feather fence field file film finger fire fish flag flame flower fly foot fork forest fox friend frog fruit game garden gate gear gift girl glass glove goat goal gold goose grape grass grid group guard guest guitar hair hand hat head heart hedge hen hero hill hint home hook horn horse house hunter island jacket jar jelly jewel job joke judge jungle key kid king kite kitten knife lake lamp lane leaf leg lemon letter level lid life light line lion list loaf lock log loop lord machine man map marble market match mate meal medal menu message mile mirror model mole monkey moon morning mother mountain mouse mouth movie mug museum nail name nest night nose note noun nurse ocean office onion orange owl page paint pair palm pan paper parent park part path peach pear pea pen pencil person pet photo piano picture piece pig pill pilot pin pipe planet plane plant plate player plum pocket poem point pond pool port potato pot prize puzzle queen quiz rabbit race radio rain range rat ray reader reef result ride ring river road rock rocket role roof room root rope rose rule runner sail sailor salad salt sand scarf scene school score sea seal seat seed shark sheep shell shelf ship shirt shoe shop shore show shrimp side sign singer sink sister skate skill sky snake sock soldier son song sound soup space spark spider spin sport spot spray spring squad stage stair stamp star station step stick stone stop store storm story straw street string student studio suit summer sun sunset table tank tap task tea team tear teen temple tent term test theatre thing thorn thread ticket tide tiger tile time timer tire toe tomato tooth tool top torch tower town toy track trail train tree trick trip troll trout truck tube tulip tunnel turtle twin type uncle unit valley valve van vase veil vest video view vine visitor voice vote wagon wall wallet watch water wave week wheel whale wheat wife wind window wing winter wish witch woman wood word work world worm writer yard year zebra zoo'
).toUpperCase().trim().split(/\s+/);
const IRREGULAR_PLURALS=Object.freeze({
 MAN:'MEN',WOMAN:'WOMEN',MOUSE:'MICE',GOOSE:'GEESE',
 FOOT:'FEET',TOOTH:'TEETH',CHILD:'CHILDREN',PERSON:'PEOPLE',
 OX:'OXEN',LOUSE:'LICE',LEAF:'LEAVES',KNIFE:'KNIVES',
 WIFE:'WIVES',WOLF:'WOLVES',LOAF:'LOAVES',SHELF:'SHELVES',
 CALF:'CALVES',HALF:'HALVES',QUIZ:'QUIZZES',
 HERO:'HEROES',POTATO:'POTATOES',TOMATO:'TOMATOES',ECHO:'ECHOES'
});
function pluralFor(noun){
 if(IRREGULAR_PLURALS[noun])return IRREGULAR_PLURALS[noun];
 if(/[^AEIOU]Y$/.test(noun))return noun.slice(0,-1)+'IES';
 if(/(S|X|Z|CH|SH)$/.test(noun))return noun+'ES';
 return noun+'S';
}
for(const noun of PLURAL_NOUNS){
 if(!WORD_SET.has(noun))continue;
 const plural=pluralFor(noun);
 if(plural.length>=3&&plural.length<=7)WORD_SET.add(plural);
}
// Import a broader, public-domain alphabetical word list supplied by the UI.
// Keep this engine pure so offline tests and saved runs remain deterministic.
function importDictionary(raw){
 if(typeof raw!=='string'||raw.length>12000000)return {added:0,total:WORD_SET.size};
 let added=0;
 for(const token of raw.split(/[^A-Za-z]+/)){
   if(token.length<3||token.length>7)continue;
   const word=token.toUpperCase();
   if(!WORD_SET.has(word)){WORD_SET.add(word);added++;}
 }
 return {added,total:WORD_SET.size};
}
// Loaded from the versioned same-origin PWA asset before this engine runs.
// Unlike a third-party dictionary request, these words work on the first
// launch without an online connection and never block game input.
if(typeof globalThis.GridClubWordRescueLexicon==='string'){
 importDictionary(globalThis.GridClubWordRescueLexicon);
 delete globalThis.GridClubWordRescueLexicon;
}
const SEEDS='PLANET SINGER SILVER BRIDGE STREAM SHARKS GARDEN MARKET WINTER SUMMER FLOWER BRIGHT CANDLE PLANTS STONES PLAYER ROCKET LITTLE OCEANS BOTTLE FRIEND CAMERA ORANGE DRAGON TUNNEL RABBIT NATURE TRAVEL PURPLE MARBLE JACKET BANNER WIZARD CASTLE BASKET ANCHOR ARTIST PILOTS PENCIL MONKEY SHIELD LETTER SUMMIT HUNTER STRONG SUNSET CREATE CLOSER COMET BREAD TIGER FISHES WHEELS PIPES HONEY BROWN CROWN CHAIR TRAIN PLANE TABLE LEAF STAR SINK BOOK GAME RIVER LEMON WATER SCORE BRAVE PAPER ROSE CLOUD'.split(' ').filter(w=>WORD_SET.has(w));
const FILL='EEEEEEAAAAAIIIIOOOOONNNNRRRRTTTTSSSSLLLLCCCDDDHHHMMMPPPUUUGGBBFKVWY';
const VOWELS='AEIOU',VOWEL_WEIGHTS='AAAAAEEEEEEEIIIIOOOOUU';
function rand(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
const pick=(s,n)=>Math.floor(rand(s)*n);
function shuffleLetters(s,letters){for(let i=letters.length-1;i>0;i--){const j=pick(s,i+1);[letters[i],letters[j]]=[letters[j],letters[i]];}return letters;}
// Guarantee one vowel after refills, reracks and resumed older saves.
function ensureVowel(s){
 if(s.rack.some(letter=>VOWELS.includes(letter)))return false;
 const available=s.rack.map((letter,i)=>({letter,i})).filter(x=>x.letter&&!s.selected.includes(x.i));
 const any=s.rack.map((letter,i)=>({letter,i})).filter(x=>x.letter);
 const candidates=available.length?available:any;
 const i=candidates.length?candidates[pick(s,candidates.length)].i:s.rack.findIndex(x=>!x);
 if(i<0)return false;
 s.rack[i]=VOWEL_WEIGHTS[pick(s,VOWEL_WEIGHTS.length)];
 s.selected=s.selected.filter(x=>x!==i);
 return true;
}
function freshRack(s){
 const goal=SEEDS[pick(s,SEEDS.length)];
 const rack=goal.split('');
 while(rack.length<7)rack.push(FILL[pick(s,FILL.length)]);
 shuffleLetters(s,rack);
 if(!rack.some(c=>VOWELS.includes(c)))rack[pick(s,7)]=VOWEL_WEIGHTS[pick(s,VOWEL_WEIGHTS.length)];
 return rack;
}
function canMake(rack,word){
 const left=[...rack];
 for(const ch of word){const k=left.indexOf(ch);if(k<0)return false;left.splice(k,1);}
 return true;
}
function possibleWords(rack,used=[]){
 const excluded=new Set(used),count=rack.filter(Boolean).length;
 return [...WORD_SET].filter(w=>w.length<=count&&!excluded.has(w)&&canMake(rack,w));
}
function create(seed=Date.now(),mode='tide'){
 if(!['tide','sinking'].includes(mode))throw Error('Unknown Word Rescue mode');
 const s={version:1,mode,rng:(Number(seed)>>>0)||1,rack:[],selected:[],used:[],words:[],
 blocks:0,score:0,elapsedMs:0,expired:false,won:false,lastErodeMs:0,started:false};
 s.rack=freshRack(s);ensureVowel(s);
 return s;
}
function wordFor(s,indices=s.selected){
 if(!Array.isArray(indices)||indices.length<3||indices.length>7||
   new Set(indices).size!==indices.length)return '';
 return indices.map(i=>s.rack[i]||'').join('');
}
function select(s,index){
 if(!Number.isInteger(index)||index<0||index>6||!s.rack[index]||s.won||s.expired)return false;
 const at=s.selected.indexOf(index);
 if(at>=0)s.selected.splice(at,1);
 else if(s.selected.length<7)s.selected.push(index);
 return true;
}
function removeLast(s){s.selected.pop();}
function submit(s){
 if(s.won||s.expired)return {ok:false,reason:'The round has finished.'};
 const word=wordFor(s);
 if(word.length<3)return {ok:false,reason:'Make a word of at least 3 letters.'};
 if(!WORD_SET.has(word))return {ok:false,reason:'Not in the prototype word list. Try another word.'};
 if(s.used.includes(word))return {ok:false,reason:'You have already used that word.'};
 const points=word.length*word.length;
 s.blocks+=word.length;s.score+=points;s.words.push({word,points});s.used.push(word);
 const taken=[...s.selected];s.selected=[];
 for(const i of taken)s.rack[i]=FILL[pick(s,FILL.length)];
 for(let i=0;i<7;i++)if(!s.rack[i])s.rack[i]=FILL[pick(s,FILL.length)];
 ensureVowel(s);
 if(possibleWords(s.rack,s.used).length<2)s.rack=freshRack(s);
 ensureVowel(s);
 if(s.blocks>=24)s.won=true;
 return {ok:true,word,blocks:word.length,points,won:s.won};
}
function rerack(s){if(s.expired||s.won)return false;s.rack=freshRack(s);s.selected=[];ensureVowel(s);return true;}
// Water rises at the v0.9.29 pace, without a hard 90-second timeout.
const DURATION_MS=90000;
// Match the raft's fixed 22% bottom position. Raising both starting water
// and the danger threshold by 14 points preserves the original time pressure.
const SEA_BASELINE=22;
function waterHeight(s){return SEA_BASELINE+(s.elapsedMs/DURATION_MS)*(s.mode==='sinking'?52:60);}
function safeHeight(s){return SEA_BASELINE+17+Math.min(24,s.blocks)*1.8;}
function advance(s,ms){
 if(s.won||s.expired||!s.started)return;
 s.elapsedMs+=Math.max(0,ms);
 ensureVowel(s);
 if(s.mode==='sinking'){
   const waves=Math.floor(s.elapsedMs/7000),old=Math.floor(s.lastErodeMs/7000);
   for(let k=old;k<waves;k++){
     const present=s.rack.map((v,i)=>v?i:-1).filter(i=>i>=0);
     if(present.length>2){
       const vowelCount=present.filter(i=>VOWELS.includes(s.rack[i])).length;
       // Preserve the last vowel while other letters sink normally.
       const options=vowelCount===1?present.filter(i=>!VOWELS.includes(s.rack[i])):present;
       if(!options.length)break;
       const i=options[pick(s,options.length)];s.rack[i]='';
       s.selected=s.selected.filter(x=>x!==i);
     }
   }
   s.lastErodeMs=s.elapsedMs;
 }
 // The waterline alone ends a round. Elapsed time measures performance but
 // is not a second, competing deadline. Once the water reaches Gridda, fail.
 if(waterHeight(s)>=safeHeight(s))s.expired=true;
}
// Retained for older callers; the interface now displays elapsed time instead.
const remainingMs=s=>Math.max(0,DURATION_MS-s.elapsedMs);
function validState(s){return !!s&&s.version===1&&['tide','sinking'].includes(s.mode)&&
 Number.isInteger(s.rng)&&Array.isArray(s.rack)&&s.rack.length===7&&
 s.rack.every(c=>c===''||/^[A-Z]$/.test(c))&&Array.isArray(s.selected)&&
 s.selected.every(i=>Number.isInteger(i)&&i>=0&&i<7&&!!s.rack[i])&&
 new Set(s.selected).size===s.selected.length&&
 Array.isArray(s.used)&&Array.isArray(s.words)&&Number.isInteger(s.blocks)&&
 s.blocks>=0&&Number.isFinite(s.elapsedMs)&&s.elapsedMs>=0&&s.elapsedMs<=DURATION_MS*2&&
 typeof s.won==='boolean'&&typeof s.expired==='boolean';}
return Object.freeze({WORD_SET,SEEDS,importDictionary,create,wordFor,select,removeLast,submit,rerack,
 ensureVowel,possibleWords,canMake,advance,remainingMs,waterHeight,safeHeight,SEA_BASELINE,DURATION_MS,validState});
});