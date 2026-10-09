Vhoff.registerLoader("humor:rust", ()=>{
	
	addResources([Ust.modLoc+"humors/rust/main.css"]);

  Vhoff.registerHumor("rust",{ // themed around permanently altering and targeting
		name: "Rust",
		description: "'Modification and fixation'",
		help: "'wound';'mark';'augment'",

		primary: {
			alterations: [["primary", "rust_scrap"]],
			stats: {
				maxhp: 3
			},
		},

		secondary: {
			alterations: [["secondary", "rust_target"]],
			stats: {
				maxhp: 3
			},
		},

		utility: {
			alterations: [["evade", "rust_change"]],
			stats: {
				maxhp: 3
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

	Vhoff.registerReactionPersonalities('rust', {
		evade: ["", ""],
		crit: [""],
		crit_buff: ["", ""],
		miss: [""],
		dead: [""],
		puncture: ["", "", ""],
		regen: ["", ""],
		destabilized: ["", ""],
		stun: [""],
		laugh: ["      ", "      ", "              "],
		receive_crit: ["", "", ""],
		receive_puncture: ["", ""],
		receive_buff: ["", ""],
		receive_destabilized: [""],
		receive_rez: ["", ""],
		receive_carapace: [""],
		receive_repairs: [""],
		receive_fear: ["", "", ""],
		receive_redirection: ["", ""],
	});

  /*
	Vhoff.registerCombatModifierFromStatus("darkness", "placeholder");
	Vhoff.registerCombatModifierFromStatus("darkness", "placeholder");
	Vhoff.registerCombatModifierFromStatus("darkness", "placeholder");
  */

	Vhoff.addHumorCommerce('rust');
	if (!Ust.loadedHumors.includes('rust')){ Ust.loadedHumors.push('rust'); }
	Ust.log('ran rust humor loader');

},[]);


// Vhoff.load("humor:rust");

Ust.log('loaded rust humor file');
