/*
Vhoff.RAWLOCALETEXTS ??= {};
Vhoff.RAWLOCALETEXTS['en-us'] = `

augment:neuron_sear
	.name
		Deep Burns
	.description
		'switch tactics';'create and exploit weaknesses';'inflict debuffs'

augment:neuron_killsprite
	.name
		Persistent Poison
	.description
		'modify cognitohazardous thoughtform';'turn into long-form, indiscriminate, deblitating effect';'requires concentration to maintain'

augment:neuron_chorus
	.name
		Many Voices
	.description
		'bring allies in on song';'grant slightly less HYPERCOGNITION to entire team'

action:neuron_singe
	.name
		Singe
	.flavor
		'use caustic form offensively';'strength increases with HYPERCOGNITION'
	.events
		HIT::'[STAT::amt]';'base damage +1 per 2 [STATUS::hypercogx] on SELF'
		CRIT::'gain [STATUS::hypercog]';'inflict one of the following';'[STATUS::open_wound]';'[STATUS::weakened]'
		SPECIAL::'+5 CRIT% per [STATUS::hypercogx] on SELF'
	.usage
		.act
			%USER LASHES OUT AT %TARGET
		.hit
			%TARGET IS BURNED
		.crit
			%TARGET SUFFERS A NASTY BURN
		.miss
			%TARGET EVADES

action:neuron_sear
	.name
		Sear
	.flavor
		'target supporting structure with caustic form';'virulence increases with HYPERCOGNITION'
	.events
		HIT::'gain [STATUS::hypercog]';'[STAT::amt]';'per 3 [STATUS::hypercogx] on SELF, inflict one of the following';'[STATUS::open_wound]';'[STATUS::weakened]'
		CRIT::'inflict [STATUS::puncture]'
		SPECIAL::'+5 CRIT% per [STATUS::hypercogx] on SELF'
	.usage
		.act
			%USER LURCHES AT %TARGET
		.hit
			%TARGET'S FLAWS ARE EXPOSED
		.crit
			%TARGET IS INCREASINGLY UNSTABLE
		.miss
			%TARGET EVADES

action:neuron_coghaz
	.name
		Cognitohazard
	.flavor
		'transmit hostile thoughtform';'massive single-target damage'
	.events
		HIT::'[STAT::amt]';'+1 per [STATUS::hypercog] on SELF';'inflict [STATUS::fear]'
		CRIT::'inflict [STATUS::rot] per [STATUS::hypercog] on SELF'
		SPECIAL::'+15 HIT% / +10 CRIT% per [STATUS::hypercog] on SELF';'consumes half of current [STATUS::hypercog], rounded down'
	.usage
		.act
			%USER BROADCASTS A COGNITOHAZARD
		.hit
			%TARGET IS CORRUPTED
		.crit
			%TARGET WRITHES IN AGONY
		.miss
			%TARGET RESISTS

action:neuron_killsprite
	.name
		Killsprite
	.flavor
		'reify thoughtform anathemic to cognition';'damages even at a glance'
	.events
		HIT::'inflict [STATUS::killsprited]'
	.usage
		.act
			%USER ALTERS %TARGET'S FORM
		.hit
			%TARGET FEELS A BIT GLITCHY...

action:neuron_hum
	.name
		Hum
	.flavor
		'sing stochastic melody';'fallback action';'recommended::NEURON in UTILITY humor slot'
	.events
		USE::'gain [STATUS::hypercog]'
	.usage
		.act
			%USER HUMS A TUNE

augment:tendon_harvest
	.name
		Surgical Precision
	.description
		'analyze and extract key flesh samples of target';'less brute force, but more efficient biomass harvesting'

augment:tendon_graft
	.name
		Experimental Augmentation
	.description
		'give into experimental tendencies';'attempt to "improve" target ally with reckless abandon'

augment:tendon_necrosis
	.name
		False-Secri Vials
	.description
		'gain access to wide-range neurotoxin';'trigger mutation in vulnerable targets, then harvest viable biomass'

action:neuron_chant
	.name
		Chant
	.flavor
		'concentrate, kindle inner fire';'gain HYPERCOGNITION'
	.events
		USE::'gain [STATUS::hypercog], [STATUS::evasion]'
	.usage
		.act
			%USER SINGS A SONG

action:neuron_chorus
	.name
		Chorus
	.flavor
		'conduct focusing song';'grants party HYPERCOGNITION'
	.events
		USE::'all party members gain [STATUS::hypercog]
	.usage
		.act
			%USER'S ALLIES SING IN UNISON

action:tendon_desecrate
	.name
		Desecrate
	.flavor 
		'unearth random corpses';'unsettling behavior'
	.events
		HIT::'create 2 ally CORPSES of random non-boss enemy';'corpses have [STATUS::decaying] [STATUS::stripped]'
		SPECIAL::'[STATUS::fear] to all other actors (33%)'
	.usage
		.act
			%USER UNEARTHS THE DEAD
		.hit
			SOME BODIES ARE FOUND
		.crit
			A LARGE BODY IS EXTRACTED

action:tendon_carve
	.name
		Carve
	.flavor 
		'wildly attempt to hack at target's flesh';'grants biomass'
	.events
		HIT::'[STAT::amt] [STATUS::puncture]';'gain [STATUS::biomass]'
		CRIT::'[STATUS::fear]'
		SPECIAL::'+10 CRIT% per [STATUS::biomassx] on SELF'
	.usage
		.act
			%USER HACKS AT %TARGET
		.hit
			%TARGET'S FLESH IS CUT AWAY
		.crit
			%TARGET IS BRUTALLY WOUNDED
		.miss
			%TARGET EVADES

action:tendon_harvest
	.name
		Harvest
	.flavor 
		'surgically harvest target for biomass';'may target corpses'
	.events
		HIT ALIVE::'[STAT::amt]';'gain [STATUS::biomassx] dependent on actor'
		HIT CORPSE ({{AUTO}})::[STATUS::stripped] to ally corpse';'remove enemy corpse from combat';'gain [STATUS::biomassx] dependent on actor'
		CRIT::'[STATUS::fear]'
		SPECIAL::'+1 base damage per 2 [STATUS::biomassx]';'+5% CRIT per [STATUS::biomassx]'
	.usage
		.act
			%USER STABS AT %TARGET
		.hit
			%TARGET'S FLESH IS EXCISED
		.crit
			%TARGET FEELS THEIR WOUNDS MOUNTING
		.miss
			%TARGET EVADES

action:tendon_stitch
	.name
		Stitch
	.flavor 
		'seal wound with improvised technique';'more effective with biomass'
	.events
		HIT::'[STAT::amt]';'remove [STATUS::puncturex]'
		CRIT::'[STATUS::regen]'
		SPECIAL::'+10 CRIT% per [STATUS::biomassx] on SELF';'consumes 1 [STATUS::biomassx] if available for an extra +3HP'
	.usage
		.act
			%USER TRIAGES %TARGET
		.hit
			%TARGET STOPS BLEEDING
		.crit
			%TARGET FEELS REVITALIZED
		.miss
			THE OPERATION FAILS

action:tendon_graft
	.name
		Graft
	.flavor 
		'attempt to "augment" target';'risky but may incur powerful benefit'
	.events
		MISS::'augment failure'
		HIT, CRIT::'augment success'
		AUGMENT SUCCESS::'[STAT::healHP]';'grant one of the following';'[STATUS::empowered]';'[STATUS::surge]';'[STATUS::focused]';'[STATUS::carapace]';'[STATUS::wild_surge]'
		AUGMENT FAILURE::'[STAT::damageHP]';'inflict one of the following';'[STATUS::puncture]';'[STATUS::weakened]';'[STATUS::fear]'
		SPECIAL::'+15 CRIT% per [STATUS::biomassx] on SELF';'requires and consumes 2 [STATUS::biomassx]'
	.usage
		.act
			%USER ATTACHES SOMETHING TO %TARGET
		.hit
			%TARGET FEELS STRONGER
		.crit
			%TARGET FEELS UNSTOPPABLE
		.miss
			%TARGET FEELS WORSE

action:tendon_necrosis
	.name
		Necrosis
	.flavor 
		'aggravate festering wounds of all actors to gain biomass'
	.events
		USE::'targets ALL OTHER ACTORS with';'[STATUS::puncture]';'[STATUS::rot]';'[STATUS::open_wound]'
		HIT::'[STAT::amt]';'gain 1 [STATUS::biomassx]';'increase duration of present listed status effects by 2T'
		CRIT::'gain 1 additional [STATUS::biomassx]'
	.usage
		.act
			%USER THROWS A STRANGE VIAL
		.hit
			EVERYONE'S WOUNDS ROT
		.crit
			A HORRIBLE SMELL LINGERS
		.miss
			%USER MISSES
`;
*/
