/*
i know the restructured/reorganized version of this mod may confuse you so here's an index you can ctrl + f search to go to!!
0. USEFUL CONSTANTS AND LIBRARY FUNCTIONS -ARRHY
1. CASE MODIFICATIONS
2.5. HUMOR LOADING -ARRHY
6. STATUS EFFECTS
9. COMBAT ACTIONS
10. CUSTOM FUNCTIONS
11. FUNCTION MODIFICATIONS
12. MISCELLANEOUS (ITEMS, ITEM_EXECS, FISHIES, ETC.)

*/

// once again, this contains most of the old documentary from the original

// USEFUL CONSTANTS

addResources([Ochem.modLoc+"css/ochem.css"]);

//mod namespaces -ARRHY
// didnt wanted to override ochem's namespaces, so i just renamed them - MERAGE
window.Hmr ??= {};
window.Ust ??= {};

['log', 'warn', 'error'].forEach(m=>{
    Ust[m] = function(...elements){ console[m]("%c[UST]", 'color: #ff0066; font-style: italic;', "::", ...elements); }
    Hmr[m] = function(...elements){ console[m]("%c[HMR]", 'color: #9900ff; font-style: italic;', "::", ...elements); }
});

Ust.errorReadout = function(...texts){
    if (!texts.length){ return; }
    chatter({actor: 'actual_ust_error', text:texts[0], readout: true});
    setTimeout(()=>{ Ust.errorReadout(...texts.slice(1)); }, 250);
}

Hmr.errorReadout = function(...texts){
    if (!texts.length){ return; }
    chatter({actor: 'actual_hmr_error', text:texts[0], readout: true});
    setTimeout(()=>{ Hmr.errorReadout(...texts.slice(1)); }, 250);
}

Ust.loadDialogueActors = ()=>{
    env.dialogueActors.actual_ust_error = { 
        name: 'USTFIEND',
        noProcess: true,
        //image: Ust.modLoc+'/img/ochemfiend.gif',
        type: "ustfiend portrait-dark portrait-contain",
        voice: ()=>{play('talkflower', 0.2)}
    };
    env.dialogueActors.actual_hmr_error = { 
        name: 'HMRFIEND',
        noProcess: true,
        //image: Ust.modLoc+'/img/humorfiend.gif',
        type: "hmrfiend portrait-dark portrait-contain",
        voice: ()=>{play('talkmind', 0.2)}
    };
};

Ust.disableRateChange = ()=>{
    ratween(env.bgm, 1);
    window.oldRatween = window.ratween;
    window.ratween = (...elements)=>{Ust.log('blocking ratween', ...elements)};
}

Ust.enableRateChange = ()=>{
    if (window.oldRatween){
        window.ratween = window.oldRatween;
        window.oldRatween = undefined;
    }
}
Ust.modifyCrittaEyes = ()=>{
    if (typeof CrittaMenu == 'undefined'){
        setTimeout(Ust.modifyCrittaEyes, 100);
        return;
    }
    if (!CrittaMenu?.possibleShellEyes?.length){
        setTimeout(Ust.modifyCrittaEyes, 100);
        return;
    }
    let eyelist = [
        "https://wiki.cavesofqud.com/images/3/3d/Galgal.png",
        "https://wiki.cavesofqud.com/images/a/ac/Galgal_variation_1.png",
        "https://wiki.cavesofqud.com/images/f/ff/Galgal_variation_2.png",
        "https://wiki.cavesofqud.com/images/5/51/Galgal_variation_3.png"
    ];

    eyelist.forEach(eye=>{
        if (!CrittaMenu.possibleShellEyes.includes(eye)){ CrittaMenu.possibleShellEyes.push(eye) };
    });
}

Ust.modifyCrittaEyes();

// All humors that this mod adds (or plans to add)
Ust.modHumors ??= [
    "darkness",
    "rust",
    "glass",
    "snow",
    "spectrum",
    "paradox",
    "malware",
    //"delirium",
    //"scope",
    //"sand",
    //"okidoia",
    //"silence"
];

// Conditions for when a humor should be unlocked, and loaded if unlocked -ATHIE
// Load condition may be set by user in the BSTERMINAL later -ATHIE
Ust.modHumorConfig ??= {};
for (const humor of Ust.modHumors) {
    Ust.modHumorConfig[humor] = {
        loadCondition: ()=>true
    };
}
// Secret humors -ATHIE
//Ust.modHumorConfig.delirium.unlockFlag = "dlrm_unlocked";
//Ust.modHumorConfig.kaleidoscope.unlockFlag = "kldscp_unlocked";

// Checking functions -ATHIE
Ust.humorUnlocked ??= (name) => {
    let flag = Ust.modHumorConfig[name].unlockFlag;
    if (flag === undefined) {
        return true;
    }
    else {
        try {
            return window.check(flag);
        } catch (e) {
            return false;
        }
    }
};
Ust.humorAvailable ??= (name) =>
    Ust.humorUnlocked(name) && Ust.modHumorConfig[name].loadCondition();

// Convenience array of available humors -ATHIE
Ust.enabledHumors ??= [];
Ust.watchedFlags ??= {};
for (const humor of Ust.modHumors) {
    if (Ust.humorUnlocked(humor)) {
        if (Ust.humorAvailable(humor)) {
            Ust.enabledHumors.push(humor);
        }
    }
    else {
        let unlockFlag = Ust.modHumorConfig[humor].unlockFlag;
        Ust.watchedFlags[unlockFlag] = humor;
    }
}

Ust.loadedHumors ??= []; //humors that have finished loading

Ust.humorNames ??= { //TODO: this is duplicate data! maybe pull this from somewhere else? -ARRHY
    ichor: "Ichor",
    claws: "Claws",
    light: "Light",
    bone: "Bone",
    eyes: "Eyes",
    darkness: "Darkness",
    rust: "Rust",
    glass: "Glass",
    snow: "Snow",
    spectrum: "Spectrum",
    paradox: "Paradox",
    malware: "Malware",
    delirium: "Delirium",
    scope: "Kaleidoscope",
    sand: "Sand",
    okidoia: "Okidoia",
    silence: "Silence"
};

//TODO: this won't work once we change enabling humors in the BSTERMINAL but this is good enough for right now

Ust.humorQuantities ??= {
    "abundant": {
        humorCounts:{
            all: 3,
        },
        party: [
            ['claws', 'sand', 'bone'],
            ['darkness', 'eyes', 'hands'],
            ['malware', 'ichor', 'light']
        ]
    },
    "too many": {
        humorCounts:{
            all: 30,
        },
        party: [
            ['claws', 'sand', 'bone'],
            ['darkness', 'eyes', 'hands'],
            ['malware', 'ichor', 'light']
        ]
    }
};

Vhoff.baseHumors.concat(Ust.enabledHumors).forEach(h=>{
    Ust.humorQuantities[h] ??= {};
    Ust.humorQuantities[h].humorCounts ??= {};
    Ust.humorQuantities[h].humorCounts[h] = 12;
    Ust.humorQuantities[h].party ??= [[h,h,h],[h,h,h],[h,h,h]];
});

[3,6,9].forEach(q=>{
    Ust.humorQuantities[`random (${q})`] = ()=>{
        let humorPool = Vhoff.baseHumors.concat(Ust.enabledHumors);
        let slots = [0,1,2,3,4,5,6,7,8];
        let party = [[null,null,null],[null,null,null],[null,null,null]];
        let humorCounts = {};
        for (let i = 0; i < q; i++) {
            let humor = humorPool.sample();
            let slot = slots.sample({remove: true});
            humorCounts[humor] ??= 0;
            humorCounts[humor] += 1;
            party[slot%3][Math.floor(slot/3)] = humor;
        }
        return {
            party,
            humorCounts
        }
    };
});

Ust.recalculateDialogue = ()=>{

    let oldExec = env.dialogues.dreamrun.start.responses[0].replies[0].exec;
    env.dialogues.dreamrun.start.responses[0].replies[0].exec = ()=>{localStorage.removeItem('frameSave'); oldExec();}

    let dialogueLoop    = new Vhoff.DialogueSection('loop');
    let dialogueStart   = new Vhoff.DialogueSection('start');
    let dialogueTension = new Vhoff.DialogueSection('tension');
    let dialogueHumors  = new Vhoff.DialogueSection('humors');
    let dialogueFish    = new Vhoff.DialogueSection('fish');
    let dialogueSfer    = new Vhoff.DialogueSection('sfer');

    dialogueLoop.addBody({
        actor: 'basterminal',
        text: 'ALTERED',
    }).addBodyMultiple({
        text: [
            ()=>`STARTING TENSION::'${check("e3a2_tension") || 1}'`,
            ()=>`STARTING HUMORS::'${check("e3a2_newcomp") || 'normal'}'`,
            ()=>`STARTING SFER::'${check("e3a2_sfer") || 0}'`,
        ],
        autoAdvance: true
    }).addBody({
        text: ()=>`FISH SPAWN RATE::'${check("e3a2_fishchance") ? Number(check("e3a2_fishchance")) * 100: 10}'%`,
        autoAdvance: true,
        showIf: ['e3a2__fishy']
    });

    dialogueLoop.addResponse({
        name: "adjust tension", destination: dialogueTension, hideRead: true
    }).addResponse({
        name: "adjust humors", destination: dialogueHumors, hideRead: true
    }).addResponse({
        name: "adjust sfer", destination: dialogueSfer, hideRead: true
    }).addResponse({
        name: "adjust fish", destination: dialogueFish, hideRead: true,
        showIf: ['e3a2__fishy']
    }).addResponse({
        name: "ok bye", destination: 'END'
    });

    //=========//

    dialogueStart.addBody({
        actor: 'sourceless',
        text: 'the terminal displays various controls and settings for the dream.',
    }).addBodyMultiline({
        actor: 'basterminal',
        text: `hi :b
            CURRENT SETTINGS`,
    }).addBodyMultiple({
        text: [
            ()=>`STARTING TENSION::'${check("e3a2_tension") || 1}'`,
            ()=>`STARTING HUMORS::'${check("e3a2_newcomp") || 'normal'}'`,
            ()=>`STARTING SFER::'${check("e3a2_sfer") || 0}'`,
        ],
    }).addBody({
        text: ()=>`FISH SPAWN RATE::'${check("e3a2_fishchance") ? Number(check("e3a2_fishchance")) * 100: 10}'%`,
        showIf: ['e3a2__fishy']
    });

    dialogueStart.addResponse({
        name: "adjust tension", destination: dialogueTension, hideRead: true
    }).addResponse({
        name: "adjust humors", destination: dialogueHumors, hideRead: true
    }).addResponse({
        name: "adjust sfer", destination: dialogueSfer, hideRead: true
    }).addResponse({
        name: "adjust fish", destination: dialogueFish, hideRead: true,
        showIf: ['e3a2__fishy']
    }).addResponse({
        name: "ok bye", destination: 'END'
    });

    //=========//

    dialogueTension.addBodyMultiline({
        actor: 'basterminal',
        text: `select starting tension
            1 is default`,
    });

    let tensionArr = [1,2,3,4,5,6];
    tensionArr.forEach(d=>{
        dialogueTension.addResponse({
            name: `${d}`,
            destination: dialogueLoop,
            hideRead: true,
            exec: ()=>{change("e3a2_tension", d)}
        });
    });

    //=========//

    dialogueHumors.addBodyMultiline({
        actor: 'basterminal',
        text: `select starting <span class="code">humor</span> set
            normal is default`,
    });

    let humorsArr = ['normal'];
    humorsArr.push(...Object.keys(Ust.humorQuantities));

    humorsArr.forEach(h=>{
        dialogueHumors.addResponse({
            name: h,
            destination: dialogueLoop,
            hideRead: true,
            exec: ()=>{change("e3a2_newcomp", h)}
        });
    });

    //=========//

    dialogueFish.addBodyMultiline({
        actor: 'basterminal',
        text: `select fish spawn rate
            10% is default`,
    });

    let fishQuantities = [
        ["normal", 0.1],
        ["foolish", 0.25],
        ["likely", 0.5],
        ["guaranteed", 1]
    ];

    fishQuantities.forEach(([n,q])=>{
        dialogueFish.addResponse({
            name: `${n} (${q*100}%)`,
            destination: dialogueLoop,
            hideRead: true,
            exec: ()=>{change("e3a2_fishchance", q)}
        });
    });

    //=========//

    dialogueSfer.addBodyMultiline({
        actor: 'basterminal',
        text: `select starting sfer
            none is default`,
    });

    let sferQuantities = [
        ["none", 0, "DELETE"],
        ["some", 20, 20],
        ["abundant", 40, 40],
        ["a lot", 99, 99]
    ];

    sferQuantities.forEach(([n,q,f])=>{
        dialogueSfer.addResponse({
            name: `${n} (${q})`,
            destination: dialogueLoop,
            exec: ()=>{change("e3a2_sfer", `${f}`)},
            hideRead: true
        });
    });

    dialogueStart.register('dreammod');

};

//TODO: make this better -ARRHY
Ust.recalculateNormalStats = ()=>{
    //let statExceptions = ['tendon_decaying','neuron_killsprited','repairs',"madness","unnatural_carapace","chosen","forsaken","million_teeth","critical_flaw","immobile","immobile_hardskip","invisible","incoherent","windup","redirection","redirector","conjoined","conjoined_baseslug","untargetable","sacrifice","global_impulse_bonus","appeasement","spawner","mimic","permanent_hp","imperfect_reset","weak_point","ominous_timer","lootbox","kb_immune","coiling","coiled","channeling","channeledUpon","drone_haunt","windup_telegraph","telegraph","destructible_cross","bomb_planted","kb","bp","hardened","fractalline","hands_malfunction","joy","despair_malfunction","winderup","windestup","final_windup","chitinous","porous","intangible","puppet","puppet_mega","puppet_conjoined","prone","fear_evasion","windup_telegraph_flat","windup_aim","channeling_flat","channeledUpon_flat","coiling_flat","coiled_flat","rocket_bearer","landmine_cmb","limited_actor","fatal_flaw","ultimate_flaw","agony","unnatural_repairs","cloaked","marked","floor_it","ominous_timer_short","ominous_timer_long","ominous_timer_cmb","appeasement_mega","incoherent_coiling","incoherent_coiled","acid_delayed_blast","global_impulse_bonus"];

    let normalStats = Object.values(env.STATUS_EFFECTS)
		.filter(a=>!a.slug.includes("autoplay"))
        .filter(a=>!statExceptions.includes(a.slug))
		.filter(a=>!a.impulse)
		.filter(a=>!a.passive)
		.filter(a=>!a.howitzerDesignProcess)
		.filter(a=>!a.craftyStrikeType)
		.filter(a=>!a.manufactureGolem)
		.filter(a=>!a.silent);
	let normalStatsPositive = normalStats.filter(s=>s.beneficial);
	let normalStatsNegative = normalStats.filter(s=>!s.beneficial);

    Ust.normalStatExceptions = statExceptions;
    Ust.normalStats = normalStats;
    Ust.normalStatsPositive = normalStatsPositive;
    Ust.normalStatsNegative = normalStatsNegative;
};

//TODO: make this better -ARRHY
Ust.finishLoad = ()=>{
    Object.keys(Vhoff.LOADERS).forEach(l=>Vhoff.load(l)); //quick compat before we fix loading again -ARRHY

    Ust.recalculateNormalStats();
    Ust.log('finishLoad function run');
};

Ust.finishLoadLoopID = setInterval(()=>{
    let isLoaded = Ust.enabledHumors.every(h=>Ust.loadedHumors.includes(h));
    if (isLoaded){
        Ust.finishLoad();
        clearInterval(Ust.finishLoadLoopID);
    } 
}, 1000);

// CASE MODIFICATIONS

Vhoff.onLoadFrame(()=>{

    setTimeout(Ust.finishLoadLoop, 1000);
    Ust.log('corru_entered embassy 2 detected, loading');

    page.flags.components ??= {};
    //DRY! -ARRHY
    let option = check("e3a2_newcomp");
    if (option in Ust.humorQuantities){
        let thisQuantities = Ust.humorQuantities[option];
        if (thisQuantities instanceof Function){
            thisQuantities = thisQuantities();
        }
        Vhoff.baseHumors.concat(Ust.enabledHumors).forEach(humorKey=>{
            if (thisQuantities?.humorCounts?.all){
                page.flags.components[humorKey] = thisQuantities?.humorCounts.all;
                return;
            }
            if (thisQuantities?.humorCounts && thisQuantities?.humorCounts[humorKey]){
                page.flags.components[humorKey] = thisQuantities?.humorCounts[humorKey];
                return;
            }
            page.flags.components[humorKey] = 0;
        });

        page.party[0].components = {};
        page.party[1].components = {};
        page.party[2].components = {};

        if (thisQuantities.party){
            [0,1,2].forEach(i=>{
                if(thisQuantities.party[i][0]) { page.party[i].components['primary']   = thisQuantities.party[i][0]; }
                if(thisQuantities.party[i][1]) { page.party[i].components['secondary'] = thisQuantities.party[i][1]; }
                if(thisQuantities.party[i][2]) { page.party[i].components['utility']   = thisQuantities.party[i][2]; }
            });
        }
        
    } else if (option == 'debug') {
        Vhoff.baseHumors.forEach(humorKey=>{
            page.flags.components[humorKey] = 100;
        });
        Ochem.enabledHumors.forEach(humorKey=>{
            page.flags.components[humorKey] = 100;
        });
        page.party.forEach(member=>{
            delete member.components.primary;
            delete member.components.secondary;
            delete member.components.utility;
            member.augments = [];
        });
        page.party[0].components.primary = 'dull';
        page.party[0].components.secondary = 'dull';
        page.party[0].components.utility = 'dull';
        page.party[1].components.primary = 'dull';
        page.party[1].components.secondary = 'dull';
        page.party[1].components.utility = 'dull';
        page.party[2].components.primary = 'ichor';
        page.party[2].components.secondary = 'ichor';
        page.party[2].components.utility = 'ichor';
    }

    //automatically register all humors first so that the shell view order is consistent -ARRHY
    Ust.enabledHumors.forEach(humorKey=>{
        env.COMBAT_COMPONENTS[humorKey] ??= {slug:humorKey, name:Ust.humorNames[humorKey]};
    });

    let toAdd = [];

    // TEXT

    //TODO: fix this it's SO bad oh my GOD
    //TODO: put locale loading in the preload (not in the load frame stuff?? idk) -ARRHY
    let localeLoad = [
        [
            Ust.modLoc+"/text/load.js",
            Ust.modLoc+`/text/locales/en-us.js`
        ],
        [
            ['dummyLocaleLoad',()=>{
                try {
                    Vhoff.loadLocale('en-us');
                    return false;
                } catch (e) {
                    Vhoff.errorReadout(e); Vhoff.error(e);
                    return false;
                }
            }]
        ]
    ]

    toAdd.push("text/load.js");

    // HUMOR LOADING

    Ust.enabledHumors.forEach(humor=>{
        toAdd.push(`humors/${humor}/main.js`); //haha we said the thing humors humor like the mod amirite guys -ARRHY
    });

    toAdd.push(`humors/common.js`);

    //TODO: do we still need this? -ARRHY

    document.addEventListener("corru_changed", ({detail: {key, value}})=>{
        let humor = Ust.watchedFlags[key];
        if (humor !== undefined && value) {
            Ust.log('check', key, 'high for humor', humor, 'loading...');
            toAdd.push(`humors/${humor}/main.js`);
            Ust.enabledHumors.push(humor);
            delete Ust.watchedFlags[humor];
        }
    });

    // LOADING COMBAT ACTORS

    toAdd.push("combat_actors.js");

    // LOADING EXTRA TEMP FILE

    toAdd.push("extra_temp.js");

    // LOADING OVERRIDES (TODO: refactor?)

    toAdd.push("overrides.js");

    // LOADING FISHIES

    toAdd.push("fishies.js");

    // LOADING BOSSES

    toAdd.push(`bosses/bossrush_pit/main.js`);
    toAdd.push(`bosses/citadel/main.js`);
    toAdd.push(`bosses/dullzkoviks_revenge/main.js`);
    toAdd.push(`bosses/firing_squad/main.js`);
    toAdd.push(`bosses/hazardous/main.js`);
    toAdd.push(`bosses/interviewer/main.js`);
    toAdd.push(`bosses/intrusive_rematch/main.js`);

    toAdd = toAdd.map(r=>Ust.modLoc+r);

    Vhoff.addResources(...localeLoad, toAdd, ()=>{
        Ust.enabledHumors.forEach(humor=>{
            Vhoff.load(`humor:${humor}`);
        });
        Vhoff.load(`boss:pitrush`);
        Vhoff.load(`boss:citadel`);
        Vhoff.load(`boss:dull_revenge`);
        Vhoff.load(`boss:firing_squad`);
        Vhoff.load(`boss:hazardous`);
        Vhoff.load(`boss:interviewer`);
        Vhoff.load(`boss:intrusive_rematch`);


        if (localStorage.getItem('frameSave')){
            UstMountFrameSave(localStorage.getItem('frameSave'));
        }

    });

    // this function is a teeny bit weird but nobody actually uses it so we're probably fine -ARRHY

    // wahoo !!!!!!!! swarm won't be terrible anymore !!!!!!!!!!!!!!!!!!!!! a kind light in this hateful gaze !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // everyone say thank you dutokrisa and voidkat !!!!!!!!!!!!!!!!!!
    Ust.midCombatActorTeamSwap = function(team, actorSpecifier, side = "right") { // i am renaming y'all's function though :P
        if(!env.rpg?.active) return false;

        console.warn("oh boy here we go:: " + actorSpecifier.slug  + " is now getting swapped to " + team.name)
        midCombatActorRemove(env.rpg.actors[actorSpecifier.slug])

        let enemyTeam
        switch(team.name) {
            case "enemy": enemyTeam = env.rpg.allyTeam; break;
            case "ally": enemyTeam = env.rpg.enemyTeam; break;
        }

        let actor = actorSpecifier;
        actor['sprite'] = "/img/sprites/obesk/larval/larval7.gif"
        actor['slug'] = actor['slug'] + env.rpg.entCount++
        actor['team'] = team;
        actor['enemyTeam'] = enemyTeam;

        env.rpg.actors[actor.slug] = actor
        side == "right" ? team.members.push(actor) : team.members.unshift(actor)

        //preprocessing
        if(env.rpg.settings.actorPreprocess) env.rpg.settings.actorPreprocess(actor)
        if(actor.base?.events?.onInitialize) actor.base.events.onInitialize(actor)

        //update turn order, etc
        initializeActorUI({actor, team, side, animateIn: true})
        env.rpg.turnOrder = []
        env.rpg.teams.forEach(t => { env.rpg.turnOrder = env.rpg.turnOrder.concat(t.members) })
        //update current actor accordingly
        if(side == "left") {
            env.rpg.currentActorIndex = env.rpg.turnOrder.findIndex((a) => a == env.rpg.currentActor)
        }
        updateStats()
        return actor
    }
    
    Math.randInt = function (min, max) { // min and max included <---- thank you, random stackoverflow user
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    /* INVENTORY CONTROLS */
    // thank you sola !!!! :D
    // edit of addItem() from combat.js
    // takes the actor object itself, and the the item slug whatever string, and amount of item
    // works exactly like you would expect it to
    Ust.addItemEnemy = function(actor, newItem, n = 1) {
        if (!actor.inventory) {
            actor.inventory = [];
            console.warn("attempted to add an item to a creature with no inventory, gave them an inventory first :p")
        }
        let itemObj = typeof newItem == "string" ? env.ITEM_LIST[newItem] : newItem

        if(!itemObj) {
            Ust.errorReadout(`you're trying to add an item that doesn't exist!`);
            itemObj = env.ITEM_LIST.error
        }

        let i = actor.inventory.findIndex(item => item[0].slug === itemObj.slug);
        let newNum

        // postep4todo: make item adds not fail if they WOULD go over max, only if they ARE at max
        // only reason this isn't done for EP4 is because it would screw with loot dialogue in earlier episodes that rely on the failure
        if(i >= 0) {
            if((actor.inventory[i][1] + n) > actor.inventory[i][0].max) { return false }
            actor.inventory[i][1] += n;
            newNum = actor.inventory[i][1]
        } else { //it's new, ignore anything over the max
            let maxN = (n < itemObj.max) ? n : itemObj.max;
            actor.inventory.push([itemObj, maxN]);
            newNum = maxN
        }

        document.dispatchEvent(new CustomEvent('corru_changed', { detail: { key: `ITEM!!${itemObj.slug}`, value: newNum} }));
        return true
    }

    // edit of checkItem() from combat.js
    // takes the actor object itself, and the the item slug whatever string
    //returns the amount you have
    // we don't use this but it's good diagnostic i think
    Ust.checkItemEnemy = function(actor, checkItem) {
        if(!actor.inventory) { console.warn("tried to check for an item on an empty inventory"); return false; }

        let effectiveCheckItem = typeof checkItem == "string" ? env.ITEM_LIST[checkItem] : checkItem
        if(!effectiveCheckItem) {
            Ust.errorReadout(`you're checking for an item that doesn't exist!`);
        }
        let i = actor.inventory.findIndex(item => item[0].slug === effectiveCheckItem.slug);

        var amt = 0;
        if(i >= 0) {
            amt = actor.inventory[i][1];
        }
        return amt;
    }

    // edit of removeItem() from combat.js
    //removes an item (object from main list) from inventory
    // takes the actor object itself, the item slug whatever string, and amount to remove
    //returns false if you didn't have any
    Ust.removeItemEnemy = function(actor, removeItem, n = 1) {
        let itemObj = typeof removeItem == "string" ? env.ITEM_LIST[removeItem] : removeItem

        let i = actor.inventory.findIndex(item => item[0].slug === itemObj.slug);
        if(i >= 0) {
            if((actor.inventory[i][1] - n) <= 0) {
                actor.inventory.splice(i, 1);
                document.dispatchEvent(new CustomEvent('corru_changed', { detail: { key: `ITEM!!${itemObj.slug}`, value: 0} }));
            } else {
                actor.inventory[i][1] -= n;
                document.dispatchEvent(new CustomEvent('corru_changed', { detail: { key: `ITEM!!${itemObj.slug}`, value: actor.inventory[i][1]} }));
            }

            return true;
        } else {
            return false;
        }
    }


    // edit of checkItem() from combat.js
    // takes the actor object itself,and the string of the action of the item you are checking for
    // made so we can find and remove the item from their inventory after usage
    // returns the slug of the item if found
    Ust.checkItemActionEnemy = function(actor, itemAction) {
        if(!actor.inventory) { return false; }


        try {
            return actor.inventory.find(item => item[0].combatAction.slug === itemAction)[0].slug;
        } catch (error) {
            Hmr.log("i have no clue how we got here with a non item attack, it *probably* doesnt matter lol", error);
            return false;
        }
    }

    // find and remove the item tied to the action used... hope you dont have any duplicate actions on items 
    Ust.actorItemUseCheck = function(actor, itemActionName) {
        if(!actor.inventory || !actor.inventory[0]) { return false; }
        if (!itemActionName) {
                console.warn("this shoudnt happen in checkItemActionEnemy ")
        }
        let removing = Ust.checkItemActionEnemy(actor, itemActionName)

        // if we found it
        if (removing) {
            // remove it from the inventory
            Ust.removeItemEnemy(actor, removing, 1)
            
            //remove it from their action list
            let index = actor.actions.indexOf(itemActionName);
            if (index !== -1) {
                actor.actions.splice(index, 1);
            }
        }
        else 
            Hmr.log("item doesnt exist in inventory in actorItemUseCheck, but this doesnt really matter")
    }


    Ust.addEnemyItemActions = function(enemy, actionNamePool) {
        if(enemy.inventory?.length) {
            if(enemy.inventory.length == 1 && enemy.inventory[0][0].slug == "sfer_cube") {
                //don't do this
            } else {
                
                enemy.inventory.forEach(itemPair => {
                    let item = itemPair[0];
                    if(item.combatAction){
                        if(item.usableBy) if(!item.usableBy.includes(actor.slug)) return

                            // only add the item if we dont have it in the list already
                            if (!actionNamePool.includes(item.combatAction.slug)) {
                                actionNamePool.push(item.combatAction.slug);
                            }    

                    }
                })
            }
        }
    }


    // setTimeout(()=>{
    //     Vhoff.enterDummyFight();
    //     Vhoff.toggleDevPanel();
    // }, 1000)

});

Vhoff.onLoadCredits(()=>{
    
    let fundfriends = document.getElementsByClassName('creditblock fundfriends')[0];
    if (!fundfriends){ return; }
    Ust.log('modifying credits');


    let div = document.createElement('div'); 
    div.classList.add('creditblock');
    div.classList.add('contributors');
    div.classList.add('developers');
    let Humorous_Humors = `<a href="https://narrativohazard-expunged.neocities.org/codebases/narra_morehumors_release.js" target="_blank" definition="original mod ORGANIC CHEMISTRY was forked from" style="border-bottom: 1px dotted;display">Humorous Humors</a>`
    let Organic_Chemistry = `<a href="https://git.encodeco.de/circadianarrhythmia/organic-chemistry/raw/branch/latest/main.js" target="_blank" definition="original mod UNSTABLE STORM was based on" style="border-bottom: 1px dotted;display">ORGANIC CHEMISTRY</a>`
    div.innerHTML = `
        <h2 definition="thanks for playing!">MOD::UNSTABLE STORM</h2>
        <ul>
            <li><label class="codehelp">(CODE)</label><label class="art">(ART)</label> <a href="https://narrativohazard-expunged.neocities.org/" target="_blank" definition="@storm0762">Narra</a>: Created ${Humorous_Humors}, helped development of ORGANIC CHEMISTRY, made some assets</li>
            <li><label class="codehelp">(CODE)</label> <span definition="@the_dem">Max</span>: Reorganised ${Humorous_Humors}</li>
            <li><label class="art">(ART)</label> <span definition="@floptarrt_w_fourrrunderscoreares">Flop</span>: Made most icons for ${Humorous_Humors}</li>
            <li><label class="art">(ART)</label> <span definition="@aetherresonant_8799">Amber</span>: Made some icons for ${Humorous_Humors}</li>
            <li><label class="codehelp">(CODE)</label><label class="art">(ART)</label> <a href="https://arh.encodeco.de/about_me.html" target="_blank" definition="@circadian.arrhythmia">A. Wormwood</a>: Main developer of ORGANIC CHEMISTRY, made some assets</li>
            <li><label class="codehelp">(CODE)</label> <a href="https://ath.encodeco.de/" target="_blank" definition="@athie.nya">Athenaya</a>: Secondary developer of ORGANIC CHEMISTRY</li>
            <li><label class="testing">(PLAYTESTING)</label><label class="art">(CONCEPTS)</label> <span definition="@cobaltninja">CobaltNinja</span>: Driving force behind the mod</li>
            <li><label class="art">(ART)</label> <span definition="@digidoe.art">Lucien</span>: Made some assets</li>
            <li><label class="codehelp">(CODE)</label> <span definition="@catsoften">catsoften</span>: Wrote ::/FRAME/SAVE/ code</li>
            <li><label class="testing">(PLAYTESTING)</label> <span class="denselist">Sprucelass, Paradox, <a href="https://kae.fyi">Kae Vania</a>, Mint, <span definition="@daughterofthedeadmountain">Emi</span></span> </li>
            
        </ul>
    `;
    fundfriends.parentNode.insertBefore(div, fundfriends);
})

Vhoff.onLoadEnv(Ust.loadDialogueActors);
Vhoff.onLoadOzo(Ust.recalculateDialogue);

Ust.log('LOADED::UNSTABLE STORM');
