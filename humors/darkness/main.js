Vhoff.registerLoader("humor:darkness", ()=>{

  addResources([Ust.modLoc+"humors/darkness/main.css"]);

  Vhoff.registerHumor("darkness",{ // themed around limitating foes in different ways (limited vision, limited actions, etc.)
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

  /*
	Vhoff.registerAugment('backstab', {
		name: "Weakpoint Strike",
		image: "/img/sprites/combat/augs/distract.gif",
		description: "'move stealthily to strike unaware foes';'exploit critical flaws'",
		alterations: [["flicker_stab", "darkness_backstab"]],
		component: ["primary", "darkness"],
	});

	Vhoff.registerAugment('remoteshutdown', {
		name: "Remote Shutdown",
		image: "/img/sprites/combat/augs/ultraspy.gif",
		description: "'utilize illegal groundsmindry';'directly shut down foes'",
		alterations: [["shell_shutdown", "darkness_remote_shutdown"]],
		component: ["secondary", "darkness"],
	});

	Vhoff.registerAugment('evalexec', {
		name: "Planned Team Attack",
		image: "/img/sprites/combat/augs/sacrifice.gif",
		description: "'recede to plot chains of attacks from allies';'consume unnatural speed for extra primary usage'",
		alterations: [["darkness_hyperfocus", "evaluate"], ["ADD", "special_execute"]],
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


Vhoff.load("humor:darkness");

Ust.log('loaded DARKNESS humor file');
