Vhoff.registerLoader("humor:darkness", ()=>{

  addResources([Ust.modLoc+"humors/darkness/main.css"]);

  Vhoff.registerHumor("darkness",{ // themed around limitating and constricting others in different ways
		name: "Darkness",
		description: "'dread and limitation'",
		help: "'insomnia';'stasis';'veil'",

		primary: {
			alterations: [["primary", "darkness_drain"]],
			stats: {
				maxhp: 2
			},
		},

		secondary: {
			alterations: [["secondary", "darkness_terror"]],
			stats: {
				maxhp: 2
			},
		},

		utility: {
			alterations: [["evade", "darkness_enveil"]],
			stats: {
				maxhp: 2
			},
		}
	});

  /* idk what to do with the augments, considering the ing update removed them - MERAGE
	Vhoff.registerAugment('placeholder', {
		name: "placeholder",
		image: "/img/sprites/combat/augs/distract.gif",
		description: "'';''",
		alterations: [["darkness_drain", "darkness_placeholder"]],
		component: ["primary", "darkness"],
	});

	Vhoff.registerAugment('placeholdern', {
		name: "placeholder",
		image: "/img/sprites/combat/augs/ultraspy.gif",
		description: "'';''",
		alterations: [["darkness_terror", "darkness_placeholder"]],
		component: ["secondary", "darkness"],
	});

	Vhoff.registerAugment('placeholder', {
		name: "placeholder",
		image: "/img/sprites/combat/augs/sacrifice.gif",
		description: "'';''",
		alterations: [["darkness_enveil", "darkness_placeholder"]],
		component: ["utility", "darkness"],
	});
  */

	Vhoff.registerReactionPersonalities('darkness', {
		evade: ["...", "try better", "maybe next time"],
		crit: ["this was inevitable", "yes..."],
		crit_buff: ["stay up", "no time to waste"],
		miss: ["...", "stop that", "how"],
		dead: ["zzZ..."],
		puncture: ["ugh", "...", ""],
		regen: ["not bad", "peculiar"],
		destabilized: ["not.. again...", "stop this..."],
		stun: ["ö÷¡¢*+"],
		laugh: ["heh", "ha", "heheheh"],
		receive_crit: ["hey!", "dont do that again", "¡¢"],
		receive_puncture: ["this will be over soon enought", "tsk..."],
		receive_buff: ["yes, yes", "i was waiting for this"],
		receive_destabilized: ["so bright..."],
		receive_rez: ["and so i arise", "hello again"],
		receive_carapace: ["no dying today"],
		receive_repairs: ["grant me some more time"],
		receive_fear: ["what is that thing?", "when will this end...", "this shouldn't be hapening"],
		receive_redirection: ["stay focused", "dont let me down"],
	});

  /*
	Vhoff.registerCombatModifierFromStatus("darkness", "placeholder");
	Vhoff.registerCombatModifierFromStatus("darkness", "placeholder");
	Vhoff.registerCombatModifierFromStatus("darkness", "placeholder");
  */

	Vhoff.addHumorCommerce('darkness');
	if (!Ust.loadedHumors.includes('darkness')){ Ust.loadedHumors.push('darkness'); }
	Ust.log('ran DARKNESS humor loader');

},[
	"status_effect:darkness_insomnia",
	"status_effect:darkness_hypersomnia",
	"status_effect:darkness_paralich",
	"status_effect:darkness_hidden",
	"status_effect:darkness_shroud",
	"status_effect:darkness_blind",
	"status_effect:fated_darkness",
	"action:darkness_drain",
	"action:darkness_terror",
	"action:darkness_enveil",
	//"action:darkness_backstab",
	//"action:darkness_remote_shutdown",
	//"action:evaluate",
	//"action:special_execute",
	//"status_effect:dread"
,
]);


Vhoff.registerStatusEffectLoader("darkness_insomnia",{
	name: "Insomnia",
	beneficial: false,
	icon: "https://narrativohazard-expunged.neocities.org/img/passives/flop_flesh_adrenaline.gif",
	tickType: "onTurnEnd",
	outgoingFlat: -1,
	opposite: "darkness_hypersomnia",
    removes: ["darkness_hypersomnia"],
	
	events: {
		onTurn: function() {
			addStatus({target: this.status.affecting, origin: false, status: "weakened", length: 1})
			
			updateStats({actor: this.status.affecting})
		},
		onRemoveStatus: function(removingStatus) {
			if (removingStatus.slug == "darkness_insomnia") {
				addStatus({target: this.status.affecting, origin: false, status: "empowered", length: 2})
			}
		},
	},

	help: "-1 outgoing flat damage/heal. on turn, receive +1T:WEAKENED\nupon status expiery, receive +2T:EMOWERED"
});

Vhoff.registerStatusEffectLoader("darkness_hypersomnia",{
	name: "Hypersomnia",
	beneficial: true,
	icon: "https://narrativohazard-expunged.neocities.org/img/passives/flop_flesh_adrenaline.gif",
	tickType: "onTurnEnd",
	outgoingFlat: 2,
	opposite: "darkness_insomnia",
    removes: ["darkness_insomnia"],
	
	events: {
		onTurn: function() {
			addStatus({target: this.status.affecting, origin: false, status: "focused", length: 1})
			addStatus({target: this.status.affecting, origin: false, status: "evasion", length: 1})
			
			updateStats({actor: this.status.affecting})
		},
		onRemoveStatus: function(removingStatus) {
			if (removingStatus.slug == "darkness_hypersomnia") {
				addStatus({target: this.status.affecting, origin: false, status: "stun", length: 1})
			}
		},
	},

	help: "+2 outgoing flat damage/heal. on turn, receive +1T:FOCUSED and +1T:EVASION\nupon status expiery, receive 1T:STUN"
});

Vhoff.registerActionLoader("darkness_drain",{
	name: "Drain",
	type: 'target',
	anim: "basic-attack",
	usage: {
		act: "%USER INFLICTS %TARGET",
		crit: "%TARGET IS MADDENED",
		hit: "%TARGET IS DRAINED",
		miss: "%TARGET RESISTS"
	},
	details: {
		flavor: "'curse target to cause madness';'can inflict heavy terror and benefit from drained energy'",
		onHit: `'[STAT::amt] [STATUS::darkness_insomnia]'`,
		onCrit: `'[STATUS::terror] to target';'[STATUS::empowered] to self'`,
	},
	stats: {
		accuracy: 1,
		crit: 0.6,
		amt: 1,
		status: {
			darkness_insomnia: {
				name: 'darkness_insomnia',
				length: 3
			},
			terror: {
				name: 'terror',
				length: 1
			},
			empowered: {
				name: 'empowered',
				length: 1
			}
		}
	},
	exec: function(user, target) {
		return env.GENERIC_ACTIONS.singleTarget({
			action: this, 
			user, 
			target,
			hitSfx: {
				name: 'dull',
				rate: 1.25
			},
			critStatus: this.stats.status.terror,
			hitStatus: this.stats.status.darkness_insomnia, 
			critExec: ({target})=>{
				setTimeout(()=>{
					env.rpg.effectMessage.action({
						user: user,
						target: target,
						action: "%USER steals energy!"
					})
					addStatus({target: user, origin: user, status: "empowered", length: 1, noReact: true});
					play("talkfairy", 2)
				}, env.ADVANCE_RATE*0.5)
			}
		})
	},
});

Vhoff.load("humor:darkness");

Ust.log('loaded DARKNESS humor file');
