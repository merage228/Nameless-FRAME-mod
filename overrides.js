//hopefully this fixes the ADD_WINDUP shenanigans
Ust.log("overriding CrittaMenu.generateStatHTMLObject");
CrittaMenu.generateStatHTMLObject = function(stats, {member, slotName, componentName, editingMember = {}} = {}) {
    Ust.log("overridden generateStatHTMLObject function is being called");
    let returnStats = {
        core: "",
        in: "",
        out: ""
    }

    let component = false
    if(componentName) component = env.COMBAT_COMPONENTS[componentName][slotName]

    //if a specific component is specified, we can also get a list of perma/auto statuses from it
    if(component?.alterations || member?.components) {
        function addStatusLine(statusObj) {
            returnStats.core += `
                <div class="stat status" 
                    type="status" 
                    pretty="${statusObj.name}"
                    definition="${statusObj.impulse ? `IMPULSE::` : 'PASSIVE::'}'${statusObj.name}'\nEFFECT::${processHelp(statusObj, {caps: true})}"
                    good="${statusObj.beneficial ? String(statusObj.beneficial).replace("true", "good") : "bad"}"
                >+ ${statusObj.name}</div>
            `
        }

        function addActionLine(actionObj, override = "ADD") {
            let effectiveOverride = override
            switch(effectiveOverride) {
                case "ADD": break;
                case "ADD_WINDUP":
					effectiveOverride = 'WINDUP';
					break;
				case "ADD_WINDERUP":
					effectiveOverride = 'WINDUP+';
					break;
                default:
                    effectiveOverride = env.ACTIONS[override].name;
					break;
            }

            returnStats.core += `
                <div class="stat action" 
                    type="action"
                    override="${effectiveOverride}"
                    definition="ACTION++${actionObj.slug}"
                >${actionObj.name}</div>
            `
        }

        //for components, we also compile any used augments to display the proper end effect
        if(component?.alterations) {
            let effectiveAlterations = [... component.alterations]

            //get all augments that...
                // that AREN'T in pending remove AND are currently in use
                // are in the pending add
            let effectiveAugments = []
            if(editingMember.augments) effectiveAugments = effectiveAugments.concat(editingMember.augments)
            if(editingMember.augmentChanges) {
                effectiveAugments = effectiveAugments.concat(editingMember.augmentChanges.add)
                effectiveAugments = effectiveAugments.filter(aug => !editingMember.augmentChanges.remove.includes(aug))
            }

            //combine the gathered augments with the effective alterations
            //filter down to just those for this specific component and slot
            for (const augmentSlug of effectiveAugments) {
                const augment = env.ACTOR_AUGMENTS.generic[augmentSlug]
                if(augment.component[0] == slotName && augment.component[1] == componentName) effectiveAlterations = effectiveAlterations.concat(augment.alterations)
            }

            console.log('effective augments are', effectiveAugments, 'alts are', effectiveAlterations)
            for (const alteration of effectiveAlterations) {
                if(alteration[0] == "STATUS") addStatusLine(env.STATUS_EFFECTS[alteration[1]]);
                else switch(alteration[0]) {
                    case "ADD":
                        addActionLine(env.ACTIONS[alteration[1]])
                    break
                    
                    default:
						addActionLine(env.ACTIONS[alteration[1]], alteration[0])
                }
            }

        //otherwise, if a member is specified, we can get their collective statuses that way
        } else if(member?.components || member?.alterations || member?.augments) {
            for (const statusObj of getPassiveStatusesForPartyMember(member)) {
                addStatusLine(statusObj)
            }
        }
    }

    for (const statName in stats) {
        const statInfo = env.STATDATA[statName]

        if(statInfo) {
            var statValue = stats[statName]
            let goodClass = false

            //we show all HP if a member is specified
            if(statName == "maxhp" && member) {
                statValue += env.COMBAT_ACTORS[member.combatActor].maxhp
            }

            if(statValue > 0) {
                switch(statInfo.good) {
                    case "+":
                        goodClass = "good"
                    break
                    case "-":
                        goodClass = "bad"
                    break
                }
            } else if (statValue < 0) {
                switch(statInfo.good) {
                    case "+":
                        goodClass = "bad"
                    break
                    case "-":
                        goodClass = "good"
                    break
                }
            }
            
            let list = "core"
            if(statName.includes("incoming")) list = "in"
            else if(statName.includes("outgoing")) list = "out"

            returnStats[list] += `
                <div class="stat ${statName.includes("outgoing") ? "outgoing" : ""} ${statName.includes("incoming") ? "incoming" : ""}" 
                    type="${statName}" 
                    pretty="${statInfo ? statInfo.display : statName}"
                    definition="INFO::${statInfo ? statInfo.description : "'not found'"}"
                    ${goodClass ? `good=${goodClass}` : ""}
                >${statValue > 0 && statName != "maxhp" ? "+" : ""}${statInfo.percentage ?
                    `${statValue * 100}%`
                    :
                    statValue
                }</div>
            `
        }
    }

    returnStats.all = returnStats.core + returnStats.in + returnStats.out
    if(returnStats.all == "") return false
    return returnStats
};
Ust.log("should be overridden now!");

Vhoff.newShowTargets = function(actor, action, actionItem = false) {
    if(env.rpg?.is2D && !action.type.includes("boxtarg")) return env.rpg.showTargets(actor, action, actionItem)

    var itemNote = "";
    if(actionItem) {itemNote = `<span class='item-note'>(via ${actionItem.name})</span>`}
    env.rpg.querySelector(`.actor#${actor.slug}`).insertAdjacentHTML('beforeend',
        `
        <div class="target-notice">
            <span><span class="neutral">${action.verb ? action.verb : action.name}</span> whom?</span>
            ${itemNote}
            <span class="target-nevermind">NEVERMIND</span>
        </div>
        `
    );


    env.rpg.turnOrder.forEach(a => {
        if(a.box) a.box.preTargetPosition = a.box.getBoundingClientRect()  
    })

    clearEffectLines()

    // this just kind of sucks to be honest -ARRHY
    //TODO: fix this in CSS instead of overriding showTargets for this specific behavior -ARRHY
    // going to put a bandaid fix here so it only checks for how many actors are on the ally team rather than the entire turn order -NARRA
    // if we fully disable this, it'll probably make people think something's broken, so i say its best to leave it in to some extent for now -NARRA
	if(env.rpg.allyTeam.members.length < 7) { // softlock prevention for summon heavy teams
		env.rpg.classList.add('targeting')
	}
    
    //animates the target notice in after a short delay
    var targetNotice = env.rpg.querySelector('.target-notice')
    setTimeout(()=>{
        targetNotice.classList.add('active');
    }, 200);

    //hides the notice & shows their skills again if they go back
    env.rpg.nevermind = ()=>{
        MUI("off")
        targetNotice.classList.remove('active')
        clearActionsDisplay()
        showActions(actor)

        delete env.rpg.nevermind
    }
    env.rpg.querySelector('.target-nevermind').addEventListener('mousedown', env.rpg.nevermind);

    // THIS CODE SUCKS ASS SO I YOINKED SOME CODE FROM THE FUTURE -ARRHY

    // //makes the targetable actor panels glow and execute chooseTarget when clicked
    // //has default regular targets - anything not self, dead, or last-standing
    // let targetQuery = `.actor:not(#${actor.slug}):not(.dead):not(.last-stand):not(.status-untargetable)`

    // //optional additional targets based on what the type is
    // if(action.type.includes("self")) targetQuery += `, .actor#${actor.slug}`
    // if(action.type.includes("rez")) targetQuery += `, .actor.dead`
    // if(action.type.includes("support")) targetQuery =  `#${actor.team.name}-team ` + targetQuery

    // //add targetable states
    // env.rpg.querySelectorAll(targetQuery).forEach(el=>el.classList.add('targetable'))

    //TODO: the targeting code underneath should be factored out for enemy targeting -ARRHY    

    //makes the targetable actor panels glow and execute chooseTarget when clicked
    let validTargets = new Set()
    if(action.type.includes("self")) validTargets.add(actor) // normally can't self target
    env.rpg.actorList.forEach(targetActor => {
        if(
            hasStatus(targetActor, 'untargetable') // untargetable by any means (unless self?)
            || targetActor.untargetable
        ) return;

        let add = false

        ////ADD CHECKS
        //assumes all non-dead targets are valid by default when targeting
        // if(action.type.includes("target") && targetActor.state != "dead" && targetActor.state != "lastStand") add = true

        if(action.type.includes("target") && (
            targetActor.state != "dead"
        ) && targetActor.state != "lastStand") add = true

        //rez is targeted to include da dead in addition to normal targets
        // if(action.type.includes("rez") && targetActor.state == "dead") add = true

        if(
            action.type.includes("rez") && targetActor.state == "dead" &&
        ){ add = true; }

        ////REMOVE CHECKS
        //supports are team-exclusive to caster
        if(action.type.includes("support") && targetActor.team != actor.team) add = false

        //can't target self unless specified
        if(!action.type.includes("self") && actor == targetActor) add = false


        if(add) validTargets.add(targetActor)
    });

    console.log("targets before override", validTargets);

	let targetOverrides = [action.validTargetsOverride].concat(actor.statusEffects.map(s=>s.validTargetsOverride));

	targetOverrides = targetOverrides.filter(o=>o); 

    if (targetOverrides.length){
		targetOverrides.forEach(override=>{
			let newValidTargets = new Set();
			env.rpg.actorList.forEach(target => {
				if (override(actor, target, validTargets.has(target))){
					newValidTargets.add(target);
				}
			});

			validTargets = newValidTargets;
			
			console.log("targets after override", validTargets);
		});
    }
    
    //add targetable states
    validTargets.forEach(target => { 
        if(target.box) {
            target.box.classList.add('targetable')
            if(env.rpg.is2D) target.box.classList.remove('compactor')
            let clickBox = target.clickBox
            insertHitPredictHTML(actor, action, target, clickBox)

            //store the event as a prop on the element for later dispelling
            console.log("adding click callback to", clickBox, target)
            if(clickBox.clickCallback) clickBox.removeEventListener('mousedown', clickBox.clickCallback)
            clickBox.clickCallback = (e) => {
                if(e.button !== 0) return; // has to be leftclick
                chooseTarget(actor, action, target, actionItem)
            }

            if(clickBox.mouseEnterCallback) clickBox.removeEventListener('mouseenter', clickBox.mouseEnterCallback)
            clickBox.mouseEnterCallback = (e) => { // used to draw warnings
                triggerStatusEvents({target, eventName: "onTargetHover", context: {targetingActor: actor, action} })
            }

            clickBox.addEventListener('mousedown', clickBox.clickCallback)
            clickBox.addEventListener('mouseenter', clickBox.mouseEnterCallback)

        } else console.log("no box for", target);
    });
};

Vhoff.newEndCombatIfTeamDead = function(){
    if(!env.rpg.active) return true;

    let deadTeam = teamDeadCheck()
    if(teamDeadCheck() !== false && !env.rpg.endCombatDisallowed) {
        if(env.rpg.active) endCombat(deadTeam)
        return true
    }
};

Vhoff.newAdvanceTurn = function(advanceIfItsThisActorsTurn, {ignoreTime = false, clearActions = true, advanceStats = true} = {}) {
    if(env.rpg.refresh && env.rpg?.is2D) env.rpg.refresh()

    //bugout protection
    //combatBugoutRefresh() no bugout protection for you lol get softlocked
    // no but seriously we tried this and it sucked and kept getting false positives
    // was more harmful to the experience to leave in than the chance of weird behavior
    // will revisit later

    //if an actor is passed, only advance the turn if it's still their turn
    if(advanceIfItsThisActorsTurn) { 
        if(env.rpg.currentActor != advanceIfItsThisActorsTurn) {
            console.trace()
            console.warn(`ADVANCETURN - attempted to advance turn for ${advanceIfItsThisActorsTurn?.slug} when it's ${env.rpg.currentActor?.slug}'s turn, so ignoring call. halt: ${env.rpg.halt}`)
            return false
        }
    }

    if(clearActions) clearActionsDisplay();
    
    //if we need some buffer time before actually advancing, we delay the call
    //we don't set up delayed advances if we're in halt mode
    if(!env.rpg.halt && !ignoreTime && ((Date.now() - env.rpg.lastUpdate) < env.ADVANCE_RATE * 0.8) || env.rpg.delayAdvanceTime) {
        console.log("ADVANCETURN - setting a delayed advance for", advanceIfItsThisActorsTurn?.slug, env.rpg.halt)
        
        let delayTime = env.ADVANCE_RATE + (env.rpg.delayAdvanceTime || 0)
        env.rpg.delayAdvanceTime = 0 //reset for next time
        setTimeout(()=>advanceTurn(advanceIfItsThisActorsTurn), delayTime)

        env.rpg.haltedByBufferTime = true
        return false
    }

    // Vhoff.log('current actor stats', env.rpg.currentActor, env.rpg.currentActor?.extraTurns, env.rpg.currentActor?.stats?.extraTurns, env.rpg.currentActor?.effectiveStats?.extraTurns);

    // initialise subturn order
    env.rpg.subTurn ??= 0;

    let extraTurns = (env.rpg.currentActor?.effectiveStats?.extraTurns ?? 0);

    let upcomingI = env.rpg.currentActorIndex;

    if (extraTurns <= env.rpg.subTurn){
        upcomingI += 1;
        upcomingI %= env.rpg.turnOrder.length;
        env.rpg.subTurn = 0;
    } else {
        env.rpg.subTurn++;
    }

    //combat-scene may run telegraphed actions for someone before their actual turn happens
    let upcomingActor = env.rpg.turnOrder[upcomingI];
    //console.log("upcoming i is", upcomingI, "which means", upcomingActor)

    //hardskips will go to the next actor without changing anything
    //this will lock up if everyone has hardskip, so don't do that
    
    //made sure this never loops more than once because while looping forever is scary -ARRHY
    let oldI = upcomingI;
    while(upcomingActor.hardSkip) {
        upcomingI = (upcomingI + 1) % env.rpg.turnOrder.length
        upcomingActor = env.rpg.turnOrder[upcomingI]
        if (upcomingI === oldI){ break; }
    }

    //scene will go here to run telegraphs
    if(!env.rpg.halt && env.rpg?.is2D) env.rpg.advanceMod("prehalt", {upcomingActor})

    //if there's a previous action effect message, we wrap it up
    if(!env.debug) {
        switch(typeof env.rpg.combineTurns) {
            case "string": // optional team-based combination used sparingly
                if(
                    (env.rpg.combineTurns == env.rpg.currentActor.team.name) &&
                    (env.rpg.currentActor.team.name == upcomingActor?.team?.name)
                ) break;

            default: 
                env.rpg.effectMessage.close()

                if( // set up the combination header
                    env.rpg.combineTurns == upcomingActor?.team?.name &&
                    env.rpg.currentActor.team.name != upcomingActor?.team?.name
                ) env.rpg.effectMessage.action({
                    user: env.rpg.enemyTeam.members[0],
                    target: env.rpg.enemyTeam.members[0],
                    action: "we are beset by incoherent foes",
                    reason: "enemy turn",
                    actionMessageIndex: -2 // 0 is false, -1 is treated as false for other reasons. -2 is intentional
                })  
        }
    } 

    //sometimes we halt for various reasons
    if(env.rpg.halt) {
        env.rpg.haltedAttempt = true
        if(env.rpg?.is2D) env.rpg.advanceMod("halted", {upcomingActor})
        return false
    }

    //combat-scene has some extra handling before we actually advance
    if(env.rpg?.is2D) env.rpg.advanceMod("before")
        
    /* handle statuses related to the previous actor if applicable */
    let prevActor = env.rpg.currentActor
    if(prevActor) if(prevActor.state != "dead" && advanceStats) {
        if(prevActor.events?.onTurnEnd || env.rpg.globalListeners?.GLOBAL_onTurnEnd?.length) triggerStatusEvents({target: prevActor, eventName: "onTurnEnd"})

        if(prevActor != upcomingActor) {
            var removingStatuses = []
        
            prevActor.statusEffects.forEach((status, i) => {       
                if(status.tickType == "onTurnEnd" && !status.justCreated) {
                    if(!status.infinite && !status.passive) status.duration -= 1;
                    if(status.duration <= 0) removingStatuses.push(status)
                } else if(status.justCreated) {
                    status.justCreated = false
                }
            });

            removingStatuses.forEach((status) => { if(!status.infinite && !status.passive) removeStatus(prevActor, status.slug, {from: "expire"}) })
            updateStats({actor: prevActor})
        }
    }

    //turnCallback before the second haltcheck
    if(env.rpg.settings.turnCallback) try { env.rpg.settings.turnCallback(upcomingActor, prevActor) } catch(e) { printError('turn callback failed'); printError(e) }

    // one more halt check since global turn events might alter this
    if(env.rpg.halt) {
        env.rpg.haltedAttempt = true
        if(env.rpg?.is2D) env.rpg.advanceMod("halted", {upcomingActor})
        return false
    }

    // set up new turn data
    // turnData is an arbitrary object refreshed every turn for holding onto data as needed
    // good for setting turn-specific flags
    env.rpg.lastTurnData = env.rpg.turnData
    if(!env.rpg.turnData) env.rpg.turnData = { turn: 0 };
    else env.rpg.turnData = { turn: env.rpg.turnData.turn + 1 };

    // actual advance happens here
    env.rpg.haltedAttempt = false
    env.rpg.haltedByBufferTime = false
    env.rpg.lastRedirector = false
    env.rpg.lastActor = env.rpg.currentActor
    
    env.rpg.currentActorIndex = upcomingI
    env.rpg.currentActor = upcomingActor

    console.log("CURRENTACTOR UDPATE!!!", env.rpg.currentActor.slug)

    if(env.rpg.currentActor.advanceModifier) env.ADVANCE_RATE = env.rpg.currentActor.advanceModifier * env.rpg.baseAdvanceRate;
    else if((env.ADVANCE_RATE != env.rpg.baseAdvanceRate) && !env.tempAdvanceRateStorage) env.ADVANCE_RATE = env.rpg.baseAdvanceRate

    // swap turn indicators
    if(prevActor.box) prevActor.box.classList.remove('current-turn')
    if(upcomingActor.box) upcomingActor.box.classList.add('current-turn')

    //console.log("advance info is", env.rpg.lastActor, env.rpg.currentActor)
    
    if(!env.rpg.currentActor) { env.rpg.currentActor = env.rpg.turnOrder[0]; console.log("error - no current actor") }
    let actor = env.rpg.currentActor;
    console.log(`ADVANCED TO ${actor.slug}`)

    //check if either team is dead
    //console.log("deadcheck before", performance.now())
    if(endCombatIfTeamDead()) return
    //console.log("deadcheck after", performance.now())

    //apply actor's statuses
    var skipTurn = false
    if(actor.state != "dead" && actor != env.rpg.lastActor && advanceStats) {
        //console.log("statuscheck before", performance.now())
        //console.log(`CHECKING ACTOR ${actor.slug} STATUS`);
        /* run status effects */
        var removingStatuses = []
        if(actor.events?.onTurn || env.rpg.globalListeners?.GLOBAL_onTurn?.length) triggerStatusEvents({target: actor, eventName: "onTurn"})
        actor.statusEffects.forEach((status, i) => {
            if(status.tickType) return; // anything with a tickType should be specially controlled
            //console.log(`    EYEBALLIN ${status.slug} - ${status.duration} (${i}) `);

            if(status.skipTurn) skipTurn = true

            //console.log(`        EXECUTING EFFECT`);
            //console.log(actor, actor.statusEffects)
            
            if(!status.infinite && !status.passive) {
                if(status.delayFirstTickForActorsOnTheRight && status.justCreated) {
                    console.log()
                    console.log(`        delayed first tick`);
                } else {
                    status.duration -= 1       
                    //console.log(`        REDUCED LENGTH TO ${status.duration}`);
                }
            }

            if(status.duration <= 0) removingStatuses.push(status)
        });

        /* after running effects, remove statuses that have expired */
        removingStatuses.forEach((status) => {
            if(!status.infinite && !status.passive) {
                removeStatus(actor, status.slug, {from: "expire"})
            }
        })
        //console.log("statuscheck after", performance.now())
    }

    //may be advanced by updateStats within status effects
    if(env.rpg.currentActor != actor) {
        console.log("ADVANCETURN - detected currentActor mismatch", env.rpg.currentActor, actor)
        return;
    }

    //reset 'turnover' class - this is what hides the action menus
    if(actor.team.name == "ally") actor.box.querySelector(".actions").classList.remove("turnover")

    if(skipTurn && actor.state != "dead" && !actor.firmSkip) {
        console.log("ADVANCE - skipTurn")
        if(env.rpg?.is2D) env.rpg.advanceMod("after", {skipped: true})
        advanceTurn(actor)
        updateStats({actor})
        return;
    }

    //enable actions if they didn't die from status effects (if they did, advance turn)
    //if player controlled, show actions for that character
    //console.log("updatestats", performance.now())
    if(actor.state != "dead" && actor.team.name == "ally") {
        if(!actor.npc) { // npc allies have their own calls in statuses. sounds insane but no time to update enemy turn
            updateStats({actor})
            showActions(actor)
        }
    } else if(actor.state != "dead" || actor.lastStand) { //if enemy, run enemy AI
        try {
            updateStats({actor})

            //todo: this is a little bruteforce but it makes sure tile effects have a bit of time to go off before targeting begins
            // ideally we just handle onActorAffected tileEffects actually before advanceTurn is called, like after using an action
            if(env.rpg?.is2D) setTimeout(()=>enemyTurn(actor), 50);
            else enemyTurn(actor)
        } catch(e) {printError(e); printError('proceeding to next turn', false); setTimeout(()=>advanceTurn(actor), env.ADVANCE_RATE); }
    } else if (advanceStats){
        console.log("ADVANCE - dead", actor.slug);

        //TODO: factor this out -ARRHY

        //console.log("statuscheck before", performance.now())
        //console.log(`CHECKING ACTOR ${actor.slug} STATUS`);
        /* run status effects */
        var removingStatuses = [];
        if(actor.events?.onTurnWhileDead || env.rpg.globalListeners?.GLOBAL_onTurnWhileDead?.length) triggerStatusEvents({target: actor, eventName: "onTurnWhileDead"});

        actor.statusEffects.forEach((status, i) => {
            Vhoff.log('dead status effect', status);
            if(!status.runOnTurnWhileDead) return; 
            
            if(!status.infinite && !status.passive) {
                if(status.delayFirstTickForActorsOnTheRight && status.justCreated) {
                    //nothin'
                } else {
                    status.duration -= 1       
                }
            }

            if(status.duration <= 0) removingStatuses.push(status);
        });

        /* after running effects, remove statuses that have expired */
        removingStatuses.forEach((status) => {
            if(!status.infinite && !status.passive) {
                removeStatus(actor, status.slug, {from: "expire"});
            }
        });
        updateStats({actor});
        //console.log("statuscheck after", performance.now())

        if(env.rpg?.is2D) env.rpg.advanceMod("after", {skipped: true})
        advanceTurn(actor, {ignoreTime: true})
    }
    //console.log("updatestats end", performance.now())

    if(env.rpg?.is2D) env.rpg.advanceMod("after")

    if(env.rpg.enemyTeam.members.length > 6) {
        env.rpg.enemyTeam.element.classList.add("team-overflow")
    }
    //TODO: can we do this? -ARRHY
    // if(env.rpg.allyTeam.members.length > 6) {
    //     env.rpg.allyTeam.element.classList.add("team-overflow")
    // }
}

//the changes here fix the ethereal actor removal bug. I Hope -ARRHY
Vhoff.newMidCombatActorRemove = function(actor, {noSpriteRemoval = false, fast = false} = {}) {
    let team = actor.team

    //assuming that the turnOrder is always consistently ALLIES then FOES (which i think it is) we can do something like this -ARRHY
    let removingActorIndex = env.rpg.turnOrder.indexOf(actor);
    let newCurrentActorIndex = env.rpg.currentActorIndex;

    if (newCurrentActorIndex >= removingActorIndex){
        newCurrentActorIndex -= 1;
    }    

    team.members = team.members.filter(a => a !== actor);
    delete env.rpg.actors[actor.slug];
    env.rpg.actorList = env.rpg.actorList.filter(a => a !== actor);

    let removeList = [actor.box];
    let spriteEl = env.rpg?.is2D ? (actor.piece || actor.deadPiece) : actor.sprite;
    if(!noSpriteRemoval && spriteEl) removeList.push(spriteEl);

    removeList.forEach(el => {
        if(!el) return;
        
        setTimeout(() => el.classList.add('phasing'), fast ? 0 : (env.rpg?.is2D ? 1000 : 200));
        setTimeout(() => el.remove(), fast ? 1 : (env.rpg?.is2D ? 4000 : 1000));
    });

    // this guy is going away so we make sure no lingering tileEffects treat them as the origin anymore
    if(env.rpg?.is2D) env.rpg.grid.tileEffects.forEach(effect => {
        if(effect.origin === actor) {
            effect.origin = false;
            if(effect.requiresOrigin) env.rpg.grid.deleteTileEffect(effect);
        }
    })

    // update turn order

    env.rpg.turnOrder = []
    env.rpg.teams.forEach(t => { env.rpg.turnOrder = env.rpg.turnOrder.concat(t.members) })
    env.rpg.turnOrder = env.rpg.turnOrder.filter(a => a !== actor)
    env.rpg.currentActorIndex = newCurrentActorIndex;
    env.rpg.currentActorIndex += env.rpg.turnOrder.length;
    env.rpg.currentActorIndex %= env.rpg.turnOrder.length;

    if(env.rpg.currentActor == actor && !env.rpg.haltedByBufferTime) { // if there's no advance queued we probably want to do this to avoid softlock
        delayAdvance(env.ADVANCE_RATE * 0.2)
        advanceTurn(actor)
    }

    // unhook events from statuses
    actor.statusEffects.forEach(s => removeStatus(actor, s.slug, {runEvents: false, forceRemoveStatus: true, from: 'midcombatdelete', noUpdate: true}))
}

Vhoff.newCombatHitLogic = function (initialTarget, {
    amt = 0, 
    acc = 1, 
    crit = 0, 
    origin = false, 
    autohit = false, 
    type = 'hp', 
    runEvents = true, 
    redirectable = true, 
    beneficial = false, 
    noKill = false, 
    ignoreMods = false, 
    dontDrawEffectLine = false, 
    forceCrit = false,
    preHitExec = false
}) {
    if(!initialTarget) throw "combatHit error - must have target"
    console.log("entering combathit with", initialTarget.name, amt, acc, crit, origin ? origin.name : 'no origin', redirectable, beneficial, noKill, ignoreMods)
    target = initialTarget
    env.rpg.lastRedirector = false

    //determine if attack should go elsewhere
    let redirectionStatus = false
    target.statusEffects.forEach(status => { if(status.redirectToOrigin && status.origin != target.name) redirectionStatus = status })

    //if the redirector is dead, the status is removed
    if(redirectionStatus) if(redirectionStatus.origin.hp <= 0) {
        removeStatus(target, "redirection")
        redirectionStatus = false
    }

    if(redirectable && redirectionStatus && beneficial == false && !env.rpg.lastRedirector) {
        target = redirectionStatus.origin
        //console.log(`REDIRECTED TO: ${target.slug} VIA ${redirectionStatus.name}, would have hit ${initialTarget.name}`);

        let redirectedTo = target
        setTimeout(()=>{
            env.rpg.effectMessage.action({
                user: redirectedTo,
                target: initialTarget,
                action: `%USER intercepts the attack on %TARGET via <span definition="${processHelp(redirectionStatus, {caps: true})}">${redirectionStatus.name}</span>`,
                reason: `redirection`
            })
        })

        env.rpg.lastRedirector = redirectionStatus.origin
    }

    //console.log(`COMBAT HIT: ${target.slug}, ${amt}, ${acc}, ${crit}`, target, origin);
    let totalAmt, totalAcc, totalCrit, originalHP, originalBP
    originalHP = initialTarget.hp
    originalBP = initialTarget.bp

    if(ignoreMods) {
        totalAmt = amt
        totalCrit = crit
        totalAcc = acc
    } else {
        let calculated = calculateHit(origin, target, {amt, acc, crit, autohit, type, forceCrit})
        totalAmt = calculated.amt
        totalAcc = calculated.acc
        totalCrit = calculated.crit
    }


    //console.log(`hit totals are: ACC: ${totalAcc}, CRIT: ${totalCrit}, AMT: ${totalAmt} with a ${critMod} crit modifier`)

    //determine total damage, then deal damage + crit if necessary
    var hit = false
    var finalAmt = 0
    if(Math.random() < totalAcc) {
        finalAmt += totalAmt;
        hit = true;

        if(Math.random() < totalCrit && type != "barrier") {
            finalAmt += totalAmt;
            hit = "crit";
        }

        //setup for effectMessage if needed
        env.rpg.effectMessage.affect({target, initializeOnly: true})
    }

    //round to whole number, rounding up if positive, or down if negative
    if(finalAmt > 0) finalAmt = Math.ceil(finalAmt)
    else if(finalAmt < 0) finalAmt = Math.floor(finalAmt)

    //apply changes, determine reaction animation type
    var damageClass = "untyped"
    switch(type) {
        case "hp":
            //deal BP damage before HP damage, heals go through though
            if(target.bp && finalAmt > 0) {
                //console.log('subtracting barrier', finalAmt, target.bp)
                target.bp -= finalAmt

                //if damage exceeds barrier, go through to HP
                if(target.bp < 0) {
                    //console.log('removing additional HP', target.bp * -1)
                    target.hp -= target.bp * -1
                }
            } else {
                //console.log('subtracting finalAmt', finalAmt)
                target.hp -= finalAmt
                
                //some abilities (esp. self inflicted) cannot kill
                if(target.hp <= 0 && noKill) {
                    target.hp = 1
                }
            }

            if(hit && amt > 0) damageClass = "struck" //hit with attack that was, at least originally, damaging
            else if(amt > 0) damageClass = "evade" 
            else if(hit && amt == 0) damageClass = "status"
            else if(hit && amt < 0) damageClass = "buff"
        break

        case "barrier":
            if(target.hp > 0) target.bp += finalAmt
            if(finalAmt > 0) damageClass = "buff";
            else damageClass = "struck"
        break
    }

    //one-hit protection - if the target is at max health, and being hit with something >= maxHP, health is instead 1
    //this never ran in the first place so i removed it -ARRHY
    // if(type == "hp" && (target.hp == target.maxhp) && target.hp <= 0) {
    //     target.hp = 1

        
    //     setTimeout(()=>env.rpg.effectMessage.action({
    //         user: target,
    //         target: target,
    //         reason: "attention",
    //         action: `'%TARGET';'one-hit protection activated'`
    //     }))
    // }

    //if damage reduction mitigated an attack completely, alert the player
    //if it's a direct attack (run events), the finalAmt is 0 but initial is greater than 0, it's a total block
    //console.log('should show mitigation?', runEvents, finalAmt == 0, amt > 0, damageClass)

    /* this is a little verbose and unneeded rn
    if(runEvents && (finalAmt == 0) && (amt > 0) && damageClass == "struck") {
        
        setTimeout(()=>env.rpg.effectMessage.action({
            user: target,
            target: target,
            reason: "attention",
            action: `'%TARGET';'complete damage mitigation'`,
            isMinor: true
        }))
    }
    */
    
    //briefly applies the animations
    let actorElements = [];
    if(target.box) actorElements.push(target.box)
    if(target.sprite) actorElements.push(target.sprite)
        
    if(env.rpg.is2D && damageClass == "struck") { env.rpg.refresh() }
    actorElements.forEach(el=>el.classList.add(damageClass))
    setTimeout(()=>actorElements.forEach(el=>el.classList.remove(damageClass)), 250)

    if(isNaN(target.hp)) {
        target.hp = 0
        printError(`combat set HP to NaN on ${target.name}, due to ${origin ? origin.name : "no origin combatHit"}. setting to 0 instead`, true)
        console.log(`${target.name} hit NaN error right here`)
    }

    //if it was a heal, make sure they don't overheal
    if(target.hp > target.maxhp) target.hp = target.maxhp

    //also limit bp
    if(target.bp > (target.maxhp * 0.5)) target.bp = Math.floor(target.maxhp * 0.5)
    if(target.bp < 0) target.bp = 0

    //handle on X events
    //due to the timeout, these are often reassigned
    let trackedTarget = target 
    let trackedOrigin = origin
    let hitContext = { subject: trackedTarget, origin: trackedOrigin, attack: finalAmt, runEvents, beneficial, initialAmt: amt, damageClass }
    let struckContext = { subject: trackedOrigin, target: trackedTarget, attack: finalAmt, runEvents, beneficial, initialAmt: amt, damageClass }

    if(runEvents) {
        setTimeout(()=>{
            switch(damageClass) {
                case "struck":
                    if(trackedOrigin) {
                        triggerStatusEvents({target: trackedOrigin, eventName: "onHit", context: hitContext })
                        triggerStatusEvents({target: trackedTarget, eventName: "onStruck", context: struckContext })

                        if(hit == "crit") {
                            triggerStatusEvents({target: trackedOrigin, eventName: "onCrit", context: hitContext })
                            triggerStatusEvents({target: trackedTarget, eventName: "onCritStruck", context: struckContext })
                        }
                    }
                break

               case "evade":
                    if(trackedOrigin) triggerStatusEvents({target: trackedOrigin, eventName: "onMiss", context: hitContext })
                    triggerStatusEvents({target: trackedTarget, eventName: "onEvade", context: struckContext })
                break

                case "buff": // "buff" is a sort of misnomer, but we're using damage classes here
                    // this is any heal or BP application
                    if(trackedOrigin) triggerStatusEvents({target: trackedOrigin, eventName: "onBuff", context: hitContext })
                    triggerStatusEvents({target: trackedTarget, eventName: "onBuffed", context: struckContext })
                break
            }
        }, 100)
    }

    //this event is ran any time anything has a chance to change HP, regardless of runEvents
    //but runEvents is passed, so if something should only happen on the first hit of something, you can look at that
    triggerStatusEvents({target, eventName: "onCombatHit", context: hitContext})

    if(hit && amt) {
        let size = 1
        if(amt > 10) size = 1.5;
        if(amt > 100) size = 2;
        if(amt > 1000) size = 4;

        sendFloater({
            target,
            type: "hit",
            amt: finalAmt,
            size,
            hit,
            damageType: type
        })

        env.rpg.effectMessage.affect({target})
    }

    //return whether it was a hit, miss, or crit and update
    updateStats({actor: target})
    if(origin.box && target.box && amt != 0 && !dontDrawEffectLine && !env.rpg.is2D) {
        let color = "bright"
        if(hit == "crit") color = "neutral"
        else if(beneficial) color = "friend"
        else if(hit) color = "obesk"

        let amt = hit == false ? "MISS" : Math.abs(finalAmt)
        if(amt == 0 || (amt != 0 && hit == "miss")) amt = false; // no floater for true 0 damage/status-only hits and misses
        else if(finalAmt == 0) { color = "bright"; amt = "0" }
    
        //try not to lie about how much BP the target actually received
        if(type == "barrier") amt = Math.min(amt, Math.floor(target.maxhp * 0.5) - originalBP)

        let effectClass = `baseline combat-hit`

        // identical to floater classes because we use the same styling
        effectClass += ` result-${hit == false ? "miss" : hit == "crit" ? "crit" : "true"}`
        effectClass += ` type-${type}`
        effectClass += ` amt-${finalAmt == 0 ? "blocked" : (finalAmt > 0 ? "positive" : "negative")}`

        // the count is used as an offset so each hit is fairly readable
        if(!env.rpg.turnData[`${origin.slug}-${target.slug}-lines`]) env.rpg.turnData[`${origin.slug}-${target.slug}-lines`] = 0;
        env.rpg.turnData[`${origin.slug}-${target.slug}-lines`]++
        let lineCount = env.rpg.turnData[`${origin.slug}-${target.slug}-lines`]
        let variation = Math.random() * (lineCount * 10) - (lineCount * 5)

        drawEffectLine(origin, target, { 
            duration: 4000,
            color,
            angleDriftAmount: 15,
            effectClass: `baseline combat-hit ${effectClass}`,
            amt,
            style: `--count: ${lineCount - 1}; --variation: ${variation}px`
        })
    }

    if(target?.piece) target.piece.flashStatPlate()   

    return hit;
}


Vhoff.newCalculateHit = function(origin, target, {amt = 0, acc = 1, crit = 0, forceCrit = false, autohit = false, type = 'hp'}) {
        //collect multipliers from statuses and stats
    var amtMod = 1 // dmg multiplier
    var accMod = 1 // acc multiplier
    var critMod = 1 // crit multiplier
    var flatAmtMod = 0
    var flatAccMod = 0
    var flatHealMod = 0
    var flatCritMod = 0
    var effectiveAmt = amt
    var effectiveCrit = crit
    var effectiveAcc = acc
    //why are you using var? -ARRHY
    var autohitMod = null;

    if(!target.effectiveStats) updateStats({actor: target})
    amtMod += target.effectiveStats.incomingMult || 0
    accMod += target.effectiveStats.incomingToHit || 0
    critMod += target.effectiveStats.incomingCrit || 0
    flatAmtMod += target.effectiveStats.incomingFlat || 0
    flatCritMod += target.effectiveStats.incomingFlatCrit || 0
    flatAccMod += target.effectiveStats.incomingFlatToHit || 0
    flatHealMod += target.effectiveStats.incomingFlatHeal || 0

    if(origin) {
        if(!origin.effectiveStats) updateStats({actor: origin})
        amtMod += origin.effectiveStats.outgoingMult || 0
        accMod += origin.effectiveStats.outgoingToHit || 0
        critMod += origin.effectiveStats.outgoingCrit || 0
        flatAmtMod += origin.effectiveStats.outgoingFlat || 0
        flatCritMod += origin.effectiveStats.outgoingFlatCrit || 0
        flatAccMod += origin.effectiveStats.outgoingFlatToHit || 0
        flatHealMod += origin.effectiveStats.outgoingFlatHeal || 0
        autohitMod ??= origin.effectiveStats.outgoingAutohit;
    }

    //flat mods applied before any multipliers
    if(flatAccMod != 0) effectiveAcc += flatAccMod
    if(flatCritMod != 0) effectiveCrit += flatCritMod
    if(flatAmtMod != 0 && amt > 0 && type != "barrier") { // flat amts only block out attacks
        effectiveAmt += flatAmtMod
        effectiveAmt = Math.max(0, effectiveAmt)
    }
    if(flatHealMod != 0 && amt < 0 && type != "barrier") { // flat heals only help out heals
        effectiveAmt += flatHealMod * -1 // so we can write statuses as having -2 to heal distinct from -2 meaning a 2HP heal
        effectiveAmt = Math.min(0, effectiveAmt) // and they can't go below 0
    }

    var effectiveAutohit = autohitMod ?? autohit;

    // determine totals - amount mod can't go under 0, acc/crit need to be between 0 and 1 (crit capped at 95%)
    amtMod = Math.max(amtMod, 0)
    totalAcc = effectiveAutohit ? 1 : Math.clamp(Math.round(accMod * effectiveAcc * 100) / 100, 0, 1)
    totalCrit = Math.clamp(Math.round(critMod * effectiveCrit * 100) / 100, 0, 0.95)
    totalAmt = (effectiveAmt * amtMod)

    if(forceCrit) totalCrit = 1

    //console.log("combathitcalc", {amt, acc, crit, effectiveAmt, effectiveAcc, effectiveCrit, amtMod, accMod, critMod, flatAmtMod, flatAccMod, flatCritMod}, {totalAmt, totalAcc, totalCrit})

    return {
        amt: totalAmt,
        acc: totalAcc,
        crit: totalCrit,
        amtMod: amtMod,
        flatAmt: flatAmtMod,
        autohit: effectiveAutohit
    }
}


Vhoff.newUpdateStatsProcess = function (actor) {
    let actorEl = actor.box
    let actorWrapperEl = actor.sprite

    triggerStatusEvents({target: actor, eventName: "onBeforeUpdateStats", context: {actor} })

    if(isNaN(actor.hp)) { 
        printError(`${actor.name}'s HP is presently NaN which means something really fucked just happened`, true) 
        actor.hp = 0
    }

    actor.hp = Math.floor(actor.hp)
    
    if(actor.hp < 0 || actor.state == "dead") { actor.hp = 0 }
    if(actor.hp == 0 && actor.state != "lastStand") {
        if(actor.hp == 0 && actor.state != 'dead' && !actor.lastStand) { //enemy is dead
            actor.hp = 0
            actor.bp = 0
            actor.state = "dead"
            reactDialogue(actor, 'dead')

            if(actorEl) actorEl.classList.add('dead')
            if(actorWrapperEl) {
                actorWrapperEl.classList.add('predead')
                setTimeout(()=>{actorWrapperEl.classList.add('dead')}, 300); // so the shrink happens after the strike animation
            }

            triggerStatusEvents({target: actor, eventName: "onDeath"}) 
            
        } else if(actor.hp == 0 && actor.state != 'dead' && actor.lastStand) { //enemy has a last stand state
            actor.hp = 0
            actor.bp = 0
            actor.state = "lastStand"
            if (actorWrapperEl) actorWrapperEl.classList.add('last-stand')
            if(actorEl) actorEl.classList.add('last-stand')

            triggerStatusEvents({target: actor, eventName: "onLastStand"}) 
        }

        let removingStatuses = []
        actor.statusEffects.forEach(status=>{ if(status.passive || status.persist) return; removingStatuses.push(status) })
        removingStatuses.forEach(status=>removeStatus(actor, status.slug, {from: "death"}))
        actor.lastDownedStatuses = removingStatuses // for reference
    }

    //generate current stats for hit calculations
    let hardSkip = false
    let firmSkip = false
    let untargetable = false
    actor.effectiveStats = {
        outgoingMult: actor?.stats?.outgoingMult || 0,
        outgoingToHit: actor?.stats?.outgoingToHit || 0,
        outgoingFlatToHit: actor?.stats?.outgoingFlatToHit || 0,
        outgoingFlat: actor?.stats?.outgoingFlat || 0,
        outgoingCrit: actor?.stats?.outgoingCrit || 0,
        outgoingFlatCrit: actor?.stats?.outgoingFlatCrit || 0,
        outgoingFlatHeal: actor?.stats?.outgoingFlatHeal || 0,
		outgoingAutohit: actor?.stats?.outgoingAutohit ?? null,
        incomingMult: actor?.stats?.incomingMult || 0,
        incomingFlat: actor?.stats?.incomingFlat || 0,
        incomingToHit: actor?.stats?.incomingToHit || 0,
        incomingFlatToHit: actor?.stats?.incomingFlatToHit || 0,
        incomingCrit: actor?.stats?.incomingCrit || 0,
        incomingFlatCrit: actor?.stats?.incomingFlatCrit || 0,
        incomingFlatHeal: actor?.stats?.incomingFlatHeal || 0,
        moveMod: actor?.stats?.moveMod || 0,
        stunImmunityMod: actor?.stats?.stunImmunityMod || 0,
        incomingStatusFlat: actor?.stats?.incomingStatusFlat || 0,
        outgoingStatusFlat: actor?.stats?.outgoingStatusFlat || 0,
        maxhp: actor.maxhp || 1,
        extraTurns: actor?.stats?.extraTurns || 0,
    }

	// Vhoff.log('895', actor.effectiveStats.outgoingAutohit);

    actor.grantedActions = []
    actor.prohibited = {}
    actor.actionDefStatusReplacers = []
    actor.actionDefSpecialNotatorStatuses = []
    if(env?.rpg?.is2D) actor.extraAOEFromStatuses = []
    
    //we do status stuff before the main actorEl updates because this way there's only one status loop
    if(actorEl) actorEl.querySelector('.statuses').innerHTML = "" //reset to add programmatically
    //console.log("statusupdate", performance.now())

    let visCount = 0
    actor.statusEffects.forEach(status => { 
        if(status.hardSkip) hardSkip = true;
        if(status.firmSkip) firmSkip = true
        if(status.untargetable) untargetable = true
        if(status.max && status.duration >= status.max) status.duration = status.max

        //to be referenced in disableIf text
        if(status.prohibitUtility) actor.prohibited.utility = status
        if(status.prohibitSecondary) actor.prohibited.secondary = status

        //handle stat accumulation
        for (const prop in status) if (status.hasOwnProperty(prop)) {
			if (prop == 'outgoingAutohit'){
				if (actor.effectiveStats.hasOwnProperty(prop)) {
					actor.effectiveStats[prop] ??= status[prop];
					// Vhoff.log('912', actor.effectiveStats.outgoingAutohit);
				}
			} else {
				if (actor.effectiveStats.hasOwnProperty(prop)) {
					actor.effectiveStats[prop] += status[prop] || 0
				}
			}
        }

        if(status.grantsActions) {
            status.grantsActions.forEach(actionSlug => {
                let actionObj = env.ACTIONS[actionSlug]
                //actions may be limited by their type if they're an itemAction
                if(
                    !actionObj.itemAction ||
                    (
                        actionObj.itemAction &&
                        (
                            (actionObj.itemAction == "2D" && check("PAGE!!2dcombat")) ||
                            (actionObj.itemAction == "1D" && !check("PAGE!!2dcombat")) ||
                            actionObj.itemAction === true
                        )
                    )
                ) actor.grantedActions.push(actionSlug)

            })
        }

        if(status.actionDefStatusReplacer) actor.actionDefStatusReplacers.push(status.actionDefStatusReplacer)
        if(status.actionDefSpecialNotator) actor.actionDefSpecialNotatorStatuses.push(status)
        if(env?.rpg?.is2D && status.extraAOE) for (const aoeName in status.extraAOE) {
            //console.log("we're in 2D and", status.slug, "has extraAOE", aoeName, "so we're adding it to", actor.name, "extraAOEFromStatuses")
            actor.extraAOEFromStatuses.push(status.extraAOE[aoeName])
            //console.log("added extraAOE", status.extraAOE[aoeName], "to actor", actor.name, actor.extraAOEFromStatuses)
        }
        
        //add regular statuses ONLY here
        //passives are statuses, but aren't updated each turn and have their own display. see addStatus for them
        if(actorEl) if(!status.passive && !status.silent && !status.subEffect) {
            visCount++
            const statusesEl = actorEl.querySelector('.statuses')
            const el = createStatusElement(status)
            statusesEl.appendChild(el)
            
            //look for any sub-statuses to this status
            actor.statusEffects.forEach(subStatus => {
                if(subStatus.subEffect == status.slug) {
                    const subEl = createStatusElement(subStatus)
                    statusesEl.appendChild(subEl)
                }
            })
        } else if(status.passive) hasPassives = true
    })

    actor.hardSkip = hardSkip
    actor.firmSkip = firmSkip
    actor.untargetable = untargetable
    
    if(actorEl) {
        actorEl.style.setProperty("--bp", Math.clamp(actor.bp, 0, 15))
        actorEl.querySelector('.name').innerHTML = actor.name
        actorEl.querySelector('.hp').innerHTML = actor.hp || "DOWN"
        actorEl.querySelector('.state').innerHTML = actor.state

        //special barrier stuff
        if(actor.bp > 0) {
            actorEl.querySelector('.bp').innerHTML = actor.bp
            actorEl.style.setProperty('--bp', Math.clamp(actor.bp, 0, 15))
            actorEl.setAttribute('barrier', true)
        } else {
            actorEl.querySelector('.bp').innerHTML = ""
            actorEl.style.removeProperty('--bp')
            actorEl.removeAttribute('barrier')
        }

        //add tip about DOWN if no HP
        if(actor.state == "lastStand") actorEl.querySelector('.hp').setAttribute("definition", "EFFECT::UTILIZING UNUSUAL RULESET")
        else if(!actor.hp) actorEl.querySelector('.hp').setAttribute("definition", "EFFECT::SKIP TURN UNTIL END OF COMBAT")
        else actorEl.querySelector('.hp').setAttribute("definition", `MAX::${actor.maxhp}`)

        //status compactor version if there's a shitton of statuses (4 or 6 or more depending on screen)
        let overflowCount = window.innerWidth < 1366 || window.innerHeight < 768 ? 3 : 5
        if(env.rpg.is2D) overflowCount = 0 // this is a really compact view
        if((visCount > overflowCount) && !env.rpg.noStatusOverflow) actorEl.classList.add("status-overflow"); else if(!actorEl.intentionalStatusOverflow) actorEl.classList.remove("status-overflow")

        //mainly for CombatGrid 
        if(visCount) actorEl.classList.add("has-statuses"); else actorEl.classList.remove("has-statuses")
    }

    if(actor.state == "dead") {
        //handle if the actor is dead but it's their turn due to async stuff
        if(
            env.rpg.currentActor == actor && 
            actor.team.name == "ally"
        ) {
            clearActionsDisplay()
            console.log("ADVANCE - current actor is dead")

            //quick clear if 2d
            if(env.rpg?.is2D && env.rpg.grid.movableTiles) env.rpg.grid.clearMovableTiles();

            advanceTurn(actor)
        }

        //if we're in grid, also set up their piece to be freakin dead
        if(env.rpg.is2D && actor?.piece?.tile) {
            setTimeout(() => {
                if(actor.state == "dead") {
                    env.rpg.actorsToRemovePiecesOf.add(actor)
                    if(actor.piece) actor.piece.classList.add("dyingpiece")
                }

                // if we advance to a player character, then this character dies to async attacks, need to mark removal
                setTimeout(()=>{
                    if(env.rpg?.movingFor?.team?.name == "ally" && actor.state == "dead") {
                        env.rpg.removePendingPiece(actor, true)
                        env.rpg.movingFor.piece.startMovement() // restart in case they were in range to block a tile
                    }
                }, env.ADVANCE_RATE * 0.1)

            }, 10)
        }
    } else if(env.rpg?.is2D && actor?.piece && actor?.piece?.tile) {
        actor.piece.tile.piece = actor.piece // redundant reinforcement of position just in case
    }

    triggerStatusEvents({target: actor, eventName: "onUpdateStats", context: {actor} })

    if(actor.highlighted) actor.highlight(false)
    endCombatIfTeamDead()
}

Vhoff.newMakeAlterations = function({initialPools, alterationList, actorSlug=false }) {

    Vhoff.log('making alterations', initialPools, alterationList, actorSlug);

    alterationList.forEach(alter=>{
        let originAbility = alter[0]
        let newAbility = alter[1]
        let tertiaryData = alter[2] || ""

        Vhoff.log('part', alter);
        
        initialPools.actions ??= [];
        let specificPool = initialPools.actions;
        if(originAbility.includes("_WINDUP")){
            initialPools.windupActions ??= [];
            specificPool = initialPools.windupActions
        }
        if(originAbility.includes("_WINDERUP")){
            initialPools.winderupActions ??= [];
            specificPool = initialPools.winderupActions
        }

        specificPool ??= [];

        if (originAbility.includes('ADD')){
            if(originAbility.includes('LEFT')) specificPool.unshift(newAbility)
            else specificPool.push(newAbility)
        } else if (originAbility.includes('REMOVE')){
            if (newAbility = 'ALL'){
                specificPool = [];
            } else {
                specificPool = specificPool.filter(actionName => actionName != newAbility);
            }
        } else if (originAbility.includes('STATUS')){
            initialPools.statuses ??= [];
            specificPool = initialPools.statuses;

            if (!originAbility.includes('ACTOR') || actorSlug === tertiaryData){
                if (newAbility && typeof newAbility == 'object'){
                    specificPool.push([...newAbility]);
                } else {
                    specificPool.push([newAbility, 1]);
                }
            }

        } else {
            if (specificPool.includes(originAbility)){
                specificPool[specificPool.indexOf(originAbility)] = newAbility;
            } else {
                Vhoff.warn(`Ability swap (${originAbility} -> ${newAbility}) failed!`);
            }
        }

    });

    Vhoff.log('initialPools statuses', initialPools.statuses);

    return initialPools;
}

Vhoff.newGetAlteredActorActions = function({member, actor, initialPools, copyPools=true, specificEquipment=false}) {
    
    let effectiveActor = actor;
    let actorSlug = actor?.slug;
    if (!actor){
        if(member.combatActor) effectiveActor = env.COMBAT_ACTORS[member.combatActor]; // party member
        else effectiveActor = env.COMBAT_ACTORS[member.originalSlug]; // enemy actor object 
        actorSlug = effectiveActor.slug;
    }

    Vhoff.log('actor', actor, 'effective actor', effectiveActor, 'actor slug', actorSlug);

    if (!initialPools && !copyPools){
        effectiveActor.actions ??= [];
        effectiveActor.sceneActions ??= [];
        effectiveActor.windupActions ??= [];
        effectiveActor.winderupActions ??= [];
        effectiveActor.windestupActions ??= [];
        effectiveActor.finalWindupActions ??= [];
        effectiveActor.aimingActions ??= [];
        effectiveActor.initialStatusEffects ??= [];
    }
    
    initialPools ??= {
        //sometimes, actors might have special alternate action pools in 2D mode
        actions: ((env.rpg?.is2D && effectiveActor.sceneActions?.length ? effectiveActor.sceneActions?.length : effectiveActor.actions) ?? []),
        windupActions: (effectiveActor.windupActions ?? []),
        winderupActions: (effectiveActor.winderupActions ?? []),
        windestupActions: (effectiveActor.windestupActions ?? []),
        finalWindupActions: (effectiveActor.finalWindupActions ?? []),
        aimingActions: (effectiveActor.aimingActions ?? []),
        statuses: (effectiveActor.initialStatusEffects ?? [])
    };

    if (copyPools) {
        initialPools.actions = [...initialPools.actions];
        initialPools.windupActions = [...initialPools.windupActions];
        initialPools.winderupActions = [...initialPools.winderupActions];
        initialPools.windestupActions = [...initialPools.windestupActions];
        initialPools.finalWindupActions = [...initialPools.finalWindupActions];
        initialPools.aimingActions = [...initialPools.aimingActions];
        initialPools.statuses = [...initialPools.statuses];
    }

    // Vhoff.log('sanity 1', copyPools, initialPools.statuses === effectiveActor.initialStatusEffects);

    //console.log('entering', member)

    let alterationList = [];
    
    if(member.components) {
        for (const componentSlot in member.components) {
            const componentName = member.components[componentSlot];
            if (!componentName) { continue; }
            const component = env.COMBAT_COMPONENTS[componentName][componentSlot];
            if (!component?.alterations) { continue; }
            alterationList.push(...component.alterations);
        }
    }

    //applies augment alterations in order
    //also accounts for if this party member is currently being edited as a generic actor
    if(member.augments || member.augmentChanges) {
        let allAugments = [... member.augments || []]
        
        if(member.augmentChanges) {
            allAugments = allAugments.concat(member.augmentChanges.add)
            allAugments = allAugments.filter(aug => !member.augmentChanges.remove.includes(aug))
        }

        //console.log('entering with', allAugments)
        allAugments.forEach(augmentName =>{
            let augment

            if(env.ACTOR_AUGMENTS[member.combatActor]) {
                augment = env.ACTOR_AUGMENTS[member.combatActor][augmentName] || env.ACTOR_AUGMENTS.all[augmentName]
            } else {
                augment = env.ACTOR_AUGMENTS.all[augmentName]
            }
            
            if(augment.alterations) alterationList.push(...augment.alterations);
        })
    }

    if(
        (member.equipment && member.equipment?.length) ||
        specificEquipment
    ) {
        let equipmentList = specificEquipment || member.equipment
        equipmentList.forEach(itemSlug=>{
            let equipment = env.ITEM_LIST[itemSlug]
            let alterations = equipment?.alterations

            // if we're not in combat but the equipment has a status,
            // it may grant actions - which we want to show in the party slides!
            if(!env?.rpg?.active && alterations?.length) {
                alterations = equipment.alterations.map(alt => [...alt])
                let actionGrants = []
                alterations.forEach(alt => {
                    console.log('checking alt', alt)
                    if(alt[0] == "STATUS") {
                        let passive = env.STATUS_EFFECTS[alt[1]]
                        if(passive.grantsActions) passive.grantsActions.forEach(act =>{
                            let actionObj = env.ACTIONS[act]
                            
                            //actions may be limited by their type if they're an itemAction
                            if(
                                !actionObj.itemAction ||
                                (
                                    actionObj.itemAction &&
                                    (
                                        (actionObj.itemAction == "2D" && check("PAGE!!2dcombat")) ||
                                        (actionObj.itemAction == "1D" && !check("PAGE!!2dcombat")) ||
                                        actionObj.itemAction === true
                                    )
                                )
                            ) actionGrants.push(["ADD", act])
                        })
                    }
                })
                alterations = alterations.concat(actionGrants)
            }

            if(equipment?.alterations) { alterationList.push(...alterations); }
        })
    }

    if(member.alterations) {
        //console.log("ALTERATIONS GETTING MADE!!", member.alterations)
        alterationList.push(...member.alterations);
        //console.log('GOT NEW POOL', pool)
    }

    //finally, detect any alterations from the teamAlterations setting

    if(env.rpg) {
        let teamAlterations = env.rpg?.settings?.teamAlterations
        
        //CTRL only works in the embassy
        let ctrlActive = (
            actor?.team?.name != "neutral" &&
            check("PAGE!!embassy_day") &&
            (
                check("PAGE!!lever-Ξ") ||
                check("lever-Δ") ||
                check("lever-Λ") ||
                check("lever-Ψ")
            )
        );

        if(env.rpg.active && (teamAlterations || ctrlActive)) {
            let combatAlterations = []
            if(!teamAlterations) teamAlterations = {}

            if(teamAlterations.all) combatAlterations = combatAlterations.concat(teamAlterations.all)
            if(actor) {
                if(ctrlActive && actor.team.name != "neutral") combatAlterations.push(["STATUS", "ctrl"])
                if(teamAlterations[actor.team.name]) combatAlterations = combatAlterations.concat(teamAlterations[actor.team.name]);
                if(teamAlterations[actor.originalSlug]) combatAlterations = combatAlterations.concat(teamAlterations[actor.originalSlug]);
            }

            alterationList.push(...combatAlterations);
        }
    }

    // Vhoff.log('final alterations', alterationList);

    let madeAlterations = makeAlterations({initialPools, alterationList, actorSlug});

    // Vhoff.log('sanity 2',  copyPools, madeAlterations === initialPools, initialPools.statuses === effectiveActor.initialStatusEffects, madeAlterations.statuses === effectiveActor.initialStatusEffects);

    return madeAlterations;
}

Vhoff.newGeneratePoolActions = function (member, poolName, {poolClass = "", poolNotice = "", poolOverride, actor, useDryReference = false} = {}) {
    
    let returnString = ``

    pools = poolOverride ?? getAlteredActorActions({member});

    pools[poolName].forEach(actionSlug => {
        let action = env.ACTIONS[actionSlug]
        returnString += `
            <span class="partymember-action ${poolClass} ${action.itemAction ? 'itemaction' : ''}" definition="ACTION++${action.slug}" ${(!actor && useDryReference) ? `fromactor="${member.slug}"` : ""} ${(actor && !useDryReference) ? `fromactor="${actor.slug}"` : ""}>
                ${action.name}
            </span>
        `
    })

    return returnString;
}


window.generatePartyActions = function generatePartyActions(member, {createDryReference = false, actor} = {}) {
    // Vhoff.log('generating party actions for', member);

    let returnString = ``;
    let combatActor = env.COMBAT_ACTORS[member.combatActor || member.originalSlug];
    if(member.mimic){ combatActor = member.mimic; }
    if(createDryReference) {
        updateStats({actor: initializeActor(member, {dry: true, usePartySlug: true}) })
    }

    let generatedPools = getAlteredActorActions({member});

    let poolName = 'actions';
    if(check("PAGE!!embassy_day", 3.99) && combatActor.sceneActions?.length) poolName = 'sceneActions';

    returnString += generatePoolActions(member, poolName, {useDryReference: createDryReference, actor})

    // Vhoff.log(`return string after ${poolName} is`, returnString);

    let actions = [
        ["windupActions"     , 'windup-action',       "WINDUP"   ],
        ["winderupActions"   , 'winderup-action',     "WINDUP+"  ],
        ["windestupActions"  , 'windestup-action',    "WINDUP++" ],
        ["finalWindupActions", 'final_windup-action', "WINDUP+++"],
        ["aimingActions"     , 'aiming-action',       "AIMING"   ]
    ];

    for (action of actions) {
        if(!check("PAGE!!embassy_day", 3.99)) {
            returnString += generatePoolActions(member, action[0], {poolClass: action[1], poolNotice: `'requires ${action[2]};`, poolOverride: generatedPools});
        }
        // Vhoff.log(`return string after ${action[0]} is`, returnString);
    }
	return returnString;
};

Vhoff.newInitializeActorUIFUCKYOU = function({actor, team, side, animateIn = false}) { // i'm gonna keep this function name the same because haha funny :) // same -ARRHY
    let i = team.members.findIndex(act => act == actor)
    var actorTemplate = `
        <div id="%SLUG" style="--index: ${i}" index="${i}" class="actor ${team.name}actor ${actor.specialClass || ""} ${animateIn ? "phasing" : ""}">
            <div class="clickbox" actor-id="%SLUG"><div class="hitpredict"></div></div>
            %PORTRAIT
            <div class="statusbg"></div>
            <span class="statdisplay">
                <span class="name"></span>
                <span class="statuses"></span>
                <span class="points">
                    <span class="hp"></span>
                    <span class="bp" definition="BARRIER_MAX::1/2 max HP"></span>
                </span>
                <span class="state"></span>
            </span>
            <div class="passives"></div>
            <div class="actions"></div>
            <div class="floatbox"></div>
            <div class="combat-dialogue"></div>
        </div>
    `

    var portrait = ""
    var insertSpot = side == "left" ? 'afterbegin' : 'beforeend'
    if(actor.portrait) {portrait = actor.portrait.replaceAll("[[PORTRAITURL]]", actor.portraitUrl)}
    if(team.name == "enemy" && env.rpg.settings?.combatClass?.includes("crittamode")) actorTemplate = actorTemplate.replace(`<div class="actions"></div>`, `<details class="enemy-actions"><summary definition="NOTE::'analysis granted via vessel terminals'">ACTIONS</summary></details>`)

    content.querySelector(`#${team.name}-team`).insertAdjacentHTML(insertSpot, actorTemplate.replaceAll('%SLUG', actor.slug).replaceAll('%PORTRAIT', portrait))
    actor.box = content.querySelector(`.team #${actor.slug}.actor`)
    actor.box.actor = actor // self referential
    actor.hitBox = actor.box.querySelector(".floatbox")
    actor.clickBox = actor.box.querySelector(".clickbox")

    /* in combat-scene, hovering a box will focus on the character */
     if(env.rpg.is2D) {
        //on mouseenter, highlight and focus on actor
        actor.box.addEventListener('mouseenter', function(ev){
            if(env.rpg.currentActor == actor || env.rpg.state == "animating" || env.rpg.classList.contains("targeting") || !actor.piece) return;
            env.rpg.grid.focusOnTile(actor.piece.tile)
            actor.highlight("box")
        })

        //on mouseleave, focus back on env.rpg.currentActor and remove highlight
        actor.box.addEventListener('mouseleave', function(){
            if(env.rpg.currentActor == actor || env.rpg.state == "animating" || env.rpg.classList.contains("targeting") || !env.rpg.currentActor.piece) return;
            env.rpg.grid.focusOnTile(env.rpg.currentActor.piece.tile)
            actor.highlight(false)
        })
    }

    if(team.name == "enemy") { 
        //only enemies get full on graphics
        let graphic = actor.graphic.replaceAll('%SLUG', actor.slug)
        if(animateIn) graphic = graphic.replace('sprite-wrapper', 'sprite-wrapper phasing')
        switch(env.rpg.tagName) {
            case "COMBAT-SCENE":
                actor.readyGraphic = graphic
            break

            default:
                content.querySelector('#enemy-graphic').insertAdjacentHTML(insertSpot, graphic)
        }

        //in crittamode, you can see enemy actions, and the zones that affect them
        if(env.rpg.settings?.combatClass?.includes("crittamode")) {
            content.querySelector(`#${actor.slug}.actor .enemy-actions`).insertAdjacentHTML('beforeend', generatePartyActions(actor, {actor}))
        }
    } else {
        //allies have components via their party members
        //enemies CAN have components directly on the object
        let componentSource = false
        if(actor.member?.components) componentSource = actor.member;
        else if (actor.components) componentSource = actor;
        
        if(componentSource !== false) actor.box.insertAdjacentHTML('beforeend', generateComponentDisplay(componentSource))
    }

    actor.sprite = content.querySelector(`#${actor.slug}-sprite-wrapper`)
    if(actor.sprite) actor.sprite.setAttribute("for", `${actor.base.slug}`)

    //handle any special spritework
    if(actor.base.events) {
        if(!env.rpg?.is2D && actor.base.events.onSpriteCreation && actor.sprite){actor.base.events.onSpriteCreation(actor.sprite);}
        if(actor.base.events.onSpawn) actor.base.events.onSpawn(actor)
    }
    if(!env.rpg?.is2D && env.rpg.settings.actorSpriteProcess) env.rpg.settings.actorSpriteProcess(actor)

    //if any actors should start with status effects, initialize them now that the element exists
    if(actor.initialStatusEffects) {
        actor.initialStatusEffects.forEach(status=>addStatus({target: actor, status: status[0], length: status[1], noReact: true, noUpdate: true, forceAdd: true}))
    }

    //ditto but at the party member level
    if(page.party) {
        let partyGuy = page.party.find(member => member.slug == actor.slug)
        if(partyGuy) {
            if(partyGuy.initialStatusEffects) {
                partyGuy.initialStatusEffects.forEach(status=>addStatus({target: actor, status: status[0], length: status[1], noReact: true, noUpdate: true, forceAdd: true}))
            }

            if(partyGuy.name != actor.name) actor.name = partyGuy.name
        }
    }

    if(animateIn) setTimeout(()=>{
        if (actor.box) {actor.box.classList.remove('phasing');}
        if (actor.sprite) {actor.sprite.classList.remove('phasing');}
    }, 100)
}

Vhoff.newTriggerStatusEvents = function({target, eventName, context, allowDryExecution}) {
    if(!target && !env?.rpg?.is2D) {
        console.log('EVENT ERROR - ', target, eventName, context)
        throw `an event (${eventName}) just tried to happen without a target. context in console`
    } else if(!target && env.rpg.is2D) return context || {}; // bypass target failure in 2D since this is actually fine usually

    let effectiveContext = ((context && typeof context == "object") ? context : {})

    if(!env.rpg.active && !allowDryExecution) return effectiveContext;

    if(target.events?.[eventName]) try {
        //JS's sort is unstable so we have to do this nonsense

        let eventsList = [...target.events[eventName]];

        while (eventsList.length) {
            let highestPriority = -Infinity;
            let idx = 0;
            eventsList.forEach((v,i)=>{
                let priority = v.priority ?? 0;
                if (priority > highestPriority){
                    highestPriority = priority;
                    idx = i;
                }
            });

            let next = eventsList.splice(idx, 1)[0];
            next.exec(effectiveContext);
        }
    } catch(e) {
        printError(e)
    }

    //as of EP3ADD2 this is expanded to include all events - used to just be onCrit - this probably won't cause many issues
    if(env.rpg.active) {
        effectiveContext.originalEventTarget = target
        triggerGlobalStatusEvents({eventName: `GLOBAL_${eventName}`, context: effectiveContext})
    }

    

    // changes may be made to the context by events in certain cases, so we bring that back
    return effectiveContext
}

Vhoff.newSingleTargetAction = function({
    action, 
    user, 
    target,
    type = 'hp',
    forceCrit = false,
    specialAmt = null, //you can specify an override damage amount with this
    specialCrit = null, //you can specify an override crit chance with this
    specialHit = null, // guess
    specialAutohit = null, // ?
    beneficial = false,
    canCrit = true,
    ignoreMods = false,

    hitSfx = {
        name: 'hit',
        rate: 1,
        volume: 1
    }, //same format for below - rate optional
    critSfx = false,
    missSfx = {name: "miss"},
    runHitEvents = true,
    redirectable = true,

    hitStatus = false, /* {
        name,
        length
        noReact: true by default
    }, or array thereof. ditto for below */
    critStatus = false,

    //optionally specific 'on x' functions
    //if critExec, won't do hitExec. use 'genExec' for any outcome
    // ^ STUPID AND WRONG -ARRHY
    preHitExec, hitExec, critExec, missExec, genExec
}){
    if(!target) {
        console.log('SINGLE TARGET ACTION', action.name, 'from', user.name, 'got no/undefined target - not throwing error cause this might be fine'); 
        console.trace()
        return "none";
    }
    let effectiveTarget = target
    let initiallyDead = effectiveTarget.state == "dead"
    
    let hit = combatHit(effectiveTarget, {
        type, 
        amt: (specialAmt ?? action?.stats?.amt ?? (action?.stats?.amt ?? action.amt)) || 0, 
        acc: specialHit ?? action.accuracy ?? action?.stats?.accuracy, 
        crit: !canCrit ? 0 : ((specialCrit ?? action?.stats?.crit ?? action.crit) || forceCrit), 
        forceCrit,
        origin: user, 
        autohit: specialAutohit ?? (action?.stats?.autohit ?? action.autohit), 
        beneficial, 
        runEvents: runHitEvents,
        ignoreMods,
        preHitExec,
        redirectable
    })
    let reactType = 'evade'

    if(env.rpg.lastRedirector) effectiveTarget = env.rpg.lastRedirector

    if(!canCrit && hit == "crit") hit = true

    switch(hit) {
        case "crit":
            if(beneficial) crit = 'critbuff' //adjusts response on return
            
            if(critSfx) play(critSfx.name, critSfx.rate, 0.75, critSfx.forcePlay);
            else if(beneficial) play(hitSfx.name, hitSfx.rate, hitSfx.volume, hitSfx.forcePlay)
            else playCombatCrit()

            if(critStatus) {
                if (critStatus.name){ critStatus = [critStatus]; }
                Vhoff.log('crit status', critStatus);
                critStatus.forEach(st=>{
                    reactType = `receive_${st.name}`
                    addStatus({target: effectiveTarget, origin: user, status: st.name, length: st.length, noReact: (st.noReact ?? true)})
                    //TODO: make this use inflictStatus? -ARRHY
                })
            } else reactType = beneficial ? 'receive_buff': 'receive_crit'
            
            if(hitStatus) {
                if (hitStatus.name){ hitStatus = [hitStatus]; }
                Vhoff.log('hit status', hitStatus);
                hitStatus.forEach(st=>{
                    reactType = `receive_${st.name}`
                    addStatus({target: effectiveTarget, origin: user, status: st.name, length: st.length, noReact: (st.noReact ?? true)})
                    //TODO: make this use inflictStatus? -ARRHY
                })
            } else reactType = beneficial ? 'receive_buff': 'hit'

            if(typeof critExec == 'function') critExec({user, target: effectiveTarget})
            if(typeof hitExec == 'function') hitExec({user, target: effectiveTarget})
        break

        case true:
            play(hitSfx.name, hitSfx.rate, hitSfx.volume, hitSfx.forcePlay)
            if(hitStatus) {
                if (hitStatus.name){ hitStatus = [hitStatus]; }
                Vhoff.log('hit status', hitStatus);
                hitStatus.forEach(st=>{
                    reactType = `receive_${st.name}`
                    addStatus({target: effectiveTarget, origin: user, status: st.name, length: st.length, noReact: (st.noReact ?? true)})
                    //TODO: make this use inflictStatus? -ARRHY
                })
            } else reactType = beneficial ? 'receive_buff': 'hit'

            if(typeof hitExec == 'function') hitExec({user, target: effectiveTarget})
        break

        case false:
            play(missSfx.name, missSfx.rate, 0.75, missSfx.forcePlay)
            if(typeof missExec == 'function') missExec({user, target: effectiveTarget})
        break
    }

    //only have the target react if they weren't dead to begin with - this is relevant for revives
    if(!initiallyDead) reactDialogue(effectiveTarget, reactType)
    if(typeof genExec == 'function') genExec({user, target: effectiveTarget, hit})

    env.rpg.lastHit = hit
        return hit
};

/*
    bgm - howler file
    bgmRate - if absent, won't change rate
    bgmStart - start time of track, if absent will be at beginning
    combatClass - applies to combat element
    startCallback() - called at start of combat
    endCallback(loser) - called at end of combat
    actorPreprocess(actor) - called just prior to the processing of each new actor as they're spawned (FOR E3A2)
    actorSpriteProcess(actor) - called after creating the sprite for an actor
    turnCallback(actor, prevActor) - called at the start of each turn
    inciterID - origin entity ID that started combat, used mostly for stage controls
    dry - creates combat object in env without actually starting combat, for use with certain combat interceptors
    teamAlterations - takes a sorta status/component/augment-like alterations list to apply based on team (FOR E3A2)
        i.e. { 
            all: [alterations],
            (teamname, i.e. "ally" or "enemy"): [alterations],
            (actor base slug, i.e. "cavik"): [alterations]
            ...
        } (all are optional - no stats object because we want alterations to enemy stats to be visible via status usually)
*/
Vhoff.newStartCombat = function(initEnemyTeam, initAllyTeam, settings = {}) {
    //if the player is somehow in a freemouse stage state, we pause that
    if(env?.stage?.freemove) {
        setTimeout(() => {
            if(!env.forcingSwap) pauseFreemove(true)
        }, 50)
    }

    console.log("starting combat with settings", settings)
    if(body.getAttribute("menu") == "party") togglePartyMenu()
    if(!settings.dry) {
        body.classList.add('in-combat', 'nomenus')
        MUI("off")

        //initialize the entire combat window and RPG object
        var sceneTemplate = settings.sceneTemplate ? settings.sceneTemplate : `
            <div id="combat" class="intro team-intro unshifted">
                <div id="enemy-graphic"></div>
                <div class="render-filter"></div>
                <div id="enemy-team" class="team"></div>
                <div id="ally-team" class="team"></div>
                ${settings.bg ? settings.bg : ``}
            </div>
        `;
        content.insertAdjacentHTML('beforeend', sceneTemplate)
        env.rpg = document.querySelector('#combat')
    } else {
        env.rpg = {}
    }

    //we add everything else as properties
    env.rpg.active = !settings.dry
    env.rpg.settings = settings
    env.rpg.turnData = { turn: 0 }
    env.rpg.turnOrder = [];
    env.rpg.teams = [];
    env.rpg.actors = {};
    env.rpg.actorList = [];
    env.rpg.entCount = 0;
    env.rpg.globalListeners = {}
    env.rpg.highlightedActors = new Set()
    env.rpg.initializing = true
    createRPGeffectMessage()

    env.rpg.enemyTeam = {name: "enemy", members: [], initial: initEnemyTeam};
    env.rpg.allyTeam = {name: "ally", members: [], initial: initAllyTeam};

    Vhoff.addTeamMethods(env.rpg.allyTeam);
    Vhoff.addTeamMethods(env.rpg.enemyTeam);

    env.rpg.teams.push(env.rpg.allyTeam);
    env.rpg.teams.push(env.rpg.enemyTeam);

    let partyLimit = page.party.partyLimit || 3
    initAllyTeam.forEach((member, i) => {
        if(i >= partyLimit ) return

        let newActor = initializeActor(member,
            {
                team: env.rpg.allyTeam,
                enemyTeam: env.rpg.enemyTeam,
                matchPartyHP: page.party.noPreserveHealth ? false : true,
                usePartySlug: (member.components || member.critta) ? true : false //for generated chars, set their combat actor slug to their party slug
            }
        )

        if(settings.actorPreprocess) settings.actorPreprocess(newActor)
        if(newActor.base?.events?.onInitialize) newActor.base.events.onInitialize(newActor)

        //determine any overrides or extra actions
        newActor.member = member
        getAlteredActorActions({member, actor: newActor, copyPools: false});
        Vhoff.log('initialised with', newActor.actions, newActor.windupActions);
    });

    initEnemyTeam.forEach(member => {
        let newActor = initializeActor(member,
            {
                team: env.rpg.enemyTeam,
                enemyTeam: env.rpg.allyTeam,
                uniqify: true
            }
        )

        if(settings.actorPreprocess) settings.actorPreprocess(newActor)
        if(newActor.base?.events?.onInitialize) newActor.base.events.onInitialize(newActor)
        getAlteredActorActions({member: newActor, actor: newActor, copyPools: false})
        Vhoff.log('initialised with', newActor.actions, newActor.windupActions, newActor.statuses);
    });

    env.rpg.baseAdvanceRate = env.ADVANCE_RATE;

    if(!settings.dry) {
        //creates the turn order and actor panels
        env.rpg.teams.forEach((team, i) => {
            env.rpg.turnOrder = env.rpg.turnOrder.concat(team.members);
            team.members.forEach((actor, i) => {
                initializeActorUI({actor, team})
                if(actor.statusEffects.length) triggerStatusEvents({target: actor, eventName: "onCombatStart"})
            });
        });

        //stage the battlezone, handle start callbacks and intros
        env.rpg = content.querySelector('#combat')

        env.rpg.querySelectorAll('.sprite, .daemon').forEach(e=>{
            e.style.animationDelay = `-${Math.random() * 10}s`
        })

        if(settings.combatClass) {
            if(typeof settings.combatClass.split == "function") env.rpg.classList.add(... settings.combatClass.split(" ").filter(className => className != ""));
            else printError(`failed to apply combatClass ${settings.combatClass}`, true)
        }

        MUI("prohibit")
        setTimeout(()=>{
            env.rpg.classList.remove('intro', 'team-intro');
            body.classList.add('cull-stage')
            content.classList.remove('show-vn')
            MUI("deprohibit")
        }, env.rpg.settings.hardOpen ? 0 : 1000);
        
        //start at end of list so it loops around
        env.rpg.currentActorIndex = env.rpg.turnOrder.length - 1
        env.rpg.currentActor = env.rpg.turnOrder[env.rpg.currentActorIndex]
        updateStats()

        //initialize stun immunity on each actor with special stun immunity
        env.rpg.turnOrder.forEach(actor=>{
            if(actor.effectiveStats.stunImmunityMod) addStatus({target: actor, status: "stun_immune", length: actor.effectiveStats.stunImmunityMod, noReact: true})
        })

        setTimeout(() => {
            console.log("ADVANCE - initial")
            advanceTurn(false, {ignoreTime: true})
        }, 100)

        if(settings.bgm) toggleBgm(settings.bgm, true)
        setTimeout(()=>{
            if(settings.bgmRate) {
                ratween(env.bgm, settings.bgmRate)
                env.bgm.intendedRate = settings.bgmRate || 1
            } else env.bgm.intendedRate = env.bgm.rate()
        }, 100)
        if(settings.bgmStart) env.bgm.seek(settings.bgmStart)
        if(settings.bgmVol) { env.bgm.volume(getModifiedVolume('music', settings.bgmVol)); env.bgm.intendedVol = settings.bgmVol }
        if(settings.startCallback) settings.startCallback();

        //if(env.rpg.classList.contains("crittamode")) env.toggleMouseThrottleLowSpeed(true)
        env.rpg.enemyTeam.element = env.rpg.querySelector('#enemy-team')
        env.rpg.allyTeam.element = env.rpg.querySelector('#ally-team')
    }

    env.rpg.refresh = ()=>{
        if(!isFirefoxOnWindows()) return;
        env.rpg.classList.add("refresh-anim")
        setTimeout(()=>env.rpg.classList.remove("refresh-anim"), 10)
    }
}

Vhoff.addTeamMethods = function(team){
    team.filterSummonTypes = function(...summonTypes){
        return team.members.filter(m=>{
            let thisTypes = m.summonTypes ?? [];

            return summonTypes.some(type=>{
                // console.log(type, typeof type);
                if (typeof type == 'string'){ type = [type]; }
                // console.log(type, typeof type);
                
                return type.every(t=>{
                    if (t.startsWith('!')){
                        return !thisTypes.includes(t.slice(1));
                    } else {
                        return thisTypes.includes(t);
                    }
                });
            });
        });
    }
}


// new unified function for adding an actor
//  - team must be one of env.rpg.allyTeam, env.rpg.enemyTeam, or env.rpg.neutralTeam
//  - neutral actors skip UI initialization and turn-order updates
//  - only allies or enemies get UI
Vhoff.newMidCombatActorAdd = function(team, actorSpecifier, side = "right", {location = "spawn", specificTile} = {}) {
    if(!env.rpg?.active) return false;
    if(!env.rpg.is2D && team.name == "neutral") throw "no support for neutrals in 1D combat";

    let enemyTeam
    switch(team.name) {
        case "enemy": enemyTeam = env.rpg.allyTeam; break;
        case "ally": enemyTeam = env.rpg.enemyTeam; break;
    }

    if (side == 'center'){
        if ((team?.members?.length ?? 0) % 2){
            side = 'right';
        } else {
            side = 'left';
        }
    }

    let actor = initializeActor(actorSpecifier, {
        team,
        enemyTeam,
        uniqify: true,
        side
    });
    env.rpg.actors[actor.slug] = actor

    //preprocessing
    if(env.rpg.settings.actorPreprocess) env.rpg.settings.actorPreprocess(actor)
    if(actor.base?.events?.onInitialize) actor.base.events.onInitialize(actor)
    getAlteredActorActions({member: actor, actor, copyPools:false})

    if(env.rpg.is2D) {
        env.rpg.grid.replaceActorPiece({target: actor, location, specificTile})

        if(team.name == "neutral" && actor.initialStatusEffects) { // since neutrals don't get UI, we handle their initials here
            actor.initialStatusEffects.forEach(
                status => addStatus({target: actor, status: status[0], length: status[1], noReact: true, noUpdate: true})
            )

            //no further action needed for neutrals so bye bye
            return actor
        }
    }

    //update turn order, etc
    initializeActorUI({actor, team, side, animateIn: true})

    //rebuild turn order based on who's supposed to be next, but only if they're on the left
    let nextActor = env.rpg.turnOrder[(env.rpg.currentActorIndex + 1) % env.rpg.turnOrder.length]
    env.rpg.turnOrder = []
    env.rpg.teams.forEach(t => { env.rpg.turnOrder = env.rpg.turnOrder.concat(t.members) })
    if(side == "left") env.rpg.currentActorIndex = env.rpg.turnOrder.findIndex(a => a === nextActor) - 1;

    if(env.rpg.is2D && actor.box) { actor.box.classList.add("compactor") }
    updateStats()

    if(actor.effectiveStats.stunImmunityMod) addStatus({target: actor, status: "stun_immune", length: actor.effectiveStats.stunImmunityMod, noReact: true})
    delayAdvance(env.ADVANCE_RATE * 0.2)

    return actor
}




Vhoff.overrideFunctions = function() { //reskinned nuclearOption; consider adding more functions to this -ARRHY
	window.showTargets = Vhoff.newShowTargets;
    window.endCombatIfTeamDead = Vhoff.newEndCombatIfTeamDead;
    window.advanceTurn = Vhoff.newAdvanceTurn;
    window.midCombatActorAdd = Vhoff.newMidCombatActorAdd;
    window.midCombatActorRemove = Vhoff.newMidCombatActorRemove;
	window.combatHitLogic = Vhoff.newCombatHitLogic;
	window.updateStatsProcess = Vhoff.newUpdateStatsProcess;
	window.makeAlterations = Vhoff.newMakeAlterations;
    window.getAlteredActorActions = Vhoff.newGetAlteredActorActions;
    window.generatePoolActions = Vhoff.newGeneratePoolActions;
    window.initializeActorUI = Vhoff.newInitializeActorUIFUCKYOU;
    window.triggerStatusEvents = Vhoff.newTriggerStatusEvents;
    window.startCombat = Vhoff.newStartCombat;
    window.calculateHit = Vhoff.newCalculateHit;
    env.GENERIC_ACTIONS.singleTarget = Vhoff.newSingleTargetAction;
};

Vhoff.overrideFunctions();

//TODO: is this still needed? if so, why, and can we fix it? -ARRHY
// UPDATE 31/07/2026: i'm just going to undo it and see what breaks -ARRHY
// setInterval(Vhoff.overrideFunctions, 5000); 

// [
//     "windupActions"     ,
//     "winderupActions"   ,
//     "windestupActions"  ,
//     "finalWindupActions",
//     "aimingActions"     ,
// ].forEach(poolid=>{
//     env.COMBAT_ACTORS.generic[poolid] ??= [];
// }); //TODO: this sucks but we need to get the mod out. ghrgrhg. move somewhere proper

window.showActions = function showActions(actor) {
    if(env.rpg.turnData.showingActions) { clearActionsDisplay() }
    env.rpg.turnData.showingActions = true
    let baseActor = env.COMBAT_ACTORS[actor.slug] //gets the original object with included functions
    let rpgActor = env.rpg.allyTeam.members.find(member => member.slug == actor.slug) //gets live object with statuses, hp, etc
	if (!rpgActor) return;
    if(!actor.box) return;

    triggerStatusEvents({target: actor, eventName: "onBeforeShowActions", context: {actor} })

    let actionsEl = actor.box.querySelector(`.actions`);
    actor.box.classList.add('acting');

    // let actionPools = getAlteredActorActions({member: actor, actor:rpgActor});

    // Vhoff.log('action pools:', actionPools);
    // Vhoff.log(hasStatus(rpgActor, "windup"));

    //activate their windup options if they have windup
	// hiiii corruu why in gods green fuck is this how windup actions work
    let actionPool = actor.actions
    if(hasStatus(rpgActor, "windup") && actor.windupActions?.length) { 
        actionPool = actor.windupActions
    }
	if(hasStatus(rpgActor, "winderup") && actor.winderupActions?.length) { 
        actionPool = actor.winderupActions
    }
	if(hasStatus(rpgActor, "windestup") && actor.windestupActions?.length) { 
        actionPool = actor.windestupActions
    }
	if(hasStatus(rpgActor, "final_windup") && actor.finalWindupActions?.length) { 
        actionPool = actor.finalWindupActions
    }
	if(hasStatus(rpgActor, "windup_telegraph_flat") && actor.windupActions?.length) { 
        actionPool = actor.windupActions
    }
	if(hasStatus(rpgActor, "windup_aim") && actor.aimingActions?.length) { 
        actionPool = actor.aimingActions
    }

    Vhoff.log('showing action pool', actionPool, 'for actor', actor, 'and rpg actor', rpgActor);

    //some statuses grant actions! yay!
    if(actor?.grantedActions?.length) actionPool = actionPool.concat(actor.grantedActions);

    //to avoid weird softlocks
    if(env.rpg?.is2D && hasStatus(actor, "fear") && actor.actions.includes("scene_evade")) {
        actionPool = [...actor.actions]
        actionPool.push("cower")
    }

    actionPool = actionPool.map(actName => env.ACTIONS[actName])
    actionPool.forEach(action => {
        let definition = `ACTION++${action.slug}`
        let disabled = false

        if(action.disableIf) disabled = action.disableIf(actor)
        if(disabled) definition = disabled
        
        const actionEl = document.createElement('span')
        actionEl.classList.add('action')
        if (disabled) { actionEl.classList.add('disabled') }
        actionEl.setAttribute('action', action.slug)
        actionEl.setAttribute('definition', definition)
        actionEl.setAttribute('fromactor', actor.slug)
        actionEl.textContent = action.name
        actionEl.action = action
        
        if(action.itemAction) {
            if(!actionsEl.querySelector('.item-container')) actionsEl.insertAdjacentHTML('afterbegin', `<div class="item-container"></div>`)
            actionsEl.querySelector('.item-container').appendChild(actionEl)
        } else {
            actionsEl.appendChild(actionEl)
        }
    });

    //TODO: do we need this anymore? -ARRHY
    // if(page?.party?.inventory?.length) {
    //     if(page.party.inventory.length == 1 && page.party.inventory[0][0].slug == "sfer_cube") {
    //         //don't do this
    //     } else {
    //         actionsEl.insertAdjacentHTML('afterbegin', `<details class="item-container"><summary>Use Item</summary></details>`)
    //         page.party.inventory.forEach(itemPair => {
    //             let item = itemPair[0];
    //             if(item.combatAction){
    //                 if(item.usableBy) if(!item.usableBy.includes(actor.slug)) return

    //                 let itemAction = env.rpg?.is2D ? (item.sceneAction || item.combatAction) : item.combatAction

    //                 const container = env.rpg.querySelector(`#${actor.slug} .item-container`)
    //                 const itemEl = document.createElement('span')
    //                 itemEl.classList.add('action')
    //                 itemEl.setAttribute('action', itemAction.slug)
    //                 itemEl.setAttribute('item', item.slug)
    //                 itemEl.setAttribute('definition', `ACTION++${itemAction.slug}`)
    //                 itemEl.action = itemAction
    //                 itemEl.item = item
    //                 itemEl.textContent = `${item.name} ${item.infinite ? "" : `x${itemPair[1]}`}`
    //                 container.appendChild(itemEl)
    //             }
    //         })
    //     }
    // }

    actor.box.querySelectorAll(`.action:not(.disabled)`).forEach(el=>{
        el.addEventListener('mousedown', function(e){
            if(e.button !== 0) return; // leftclick

            MUI("off")
            let actionItem = el.item
            let action = el.action
            let parentEl = actor.box.querySelector(".actions")
    
            if(action.type.includes("target") || action.type.includes("ground")) {
                showTargets(actor, action, actionItem);
            } else { //DOES NOT NEED A TARGET - handle any special execs (i.e. auto AOEs or something) in the action itself
                chooseTarget(actor, action, actor, actionItem);
            }
            
            //hides action list
            parentEl.classList.add('turnover')
        })

        //in combat scene, we also show some range info if it's relevant
        if(env.rpg.is2D){
            let action = el.action
            //on mouse enter, we'll set up the env.rpg.markedPreviewTiles and env.rpg.markedPreviewTileClasses arrays
            el.addEventListener('mouseenter', function(){
                if(env.rpg.markedPreviewTiles && env.rpg.markedPreviewAction != action) { 
                    env.rpg.markedPreviewTiles.forEach(tile => tile.classList.remove(... env.rpg.markedPreviewTileClasses)) 
                } else if((env.rpg.markedPreviewTiles && env.rpg.markedPreviewAction == action)) return; //only show/render range stuff when relevant

                if( //we return here because we only care about removing AOE markers for self/special
                    (action.type.includes("autohit") || action.type.includes("special")) && 
                    !action?.stats?.extraAOE
                ) { env.rpg.markedPreviewTiles = false; return; }

                env.rpg.markedPreviewAction = action
                env.rpg.markedPreviewTileClasses = ["targetable-preview"]
                
                if(!action.type.includes("autohit") && !action.type.includes("special")) {
                    env.rpg.markedPreviewTiles = env.rpg.grid.markTiles({
                        originTile: actor.piece.tile,
                        shape: action.targeting || 'square',
                        size: action?.stats?.range || action.range || 1,
                        addClass: "targetable-preview",
                        ignoresObstacles: action.ignoresBlocks,
                        ignoresLOS: action.ignoresLOS,
                        ignoresActors: typeof action.ignoresActors == "undefined" ? true : action.ignoresActors,
                        requiresPath: action.requiresPath,
                        includesOrigin: typeof action.includesOrigin != "undefined" ? action.includesOrigin : action.type.includes("self"),
                        markingForActionTarget: true,
                        onTileCheck: ({tile}) => {
                            let validity = true
                            if(tile.untargetable) validity = false
                            if(action?.aoe?.tileFilter) validity = action.aoe.tileFilter(tile, validity, actor) // additional arbitrary per-tile filter defined at action level

                            return validity
                        }
                    })
                    
                    //specialTiles is an action function that can add arbitrary tiles
                    if(action?.aoe?.specialTiles) {
                        let specialTiles = action.aoe.specialTiles(actor)
                        specialTiles.forEach(t=>t.classList.add('targetable-preview'))
                        env.rpg.markedPreviewTiles = env.rpg.markedPreviewTiles.concat(specialTiles)
                    }
                } else {
                    env.rpg.markedPreviewTiles = []
                }
                
                let handleExtraAOE = (aoeInfo) => {
                    if(
                        aoeInfo.origin == "self" &&
                        (!aoeInfo.showIf || aoeInfo.showIf(actor, actor, action))
                    )  {
                        env.rpg.markedPreviewTiles = env.rpg.markedPreviewTiles.concat(env.rpg.grid.markTiles({
                            originTile: actor.piece.tile,
                            shape: aoeInfo.shape || 'square',
                            size: aoeInfo.size || 1,
                            addClass: aoeInfo.addClass,
                            ignoresObstacles: aoeInfo.ignoresBlocks,
                            ignoresLOS: aoeInfo.ignoresLOS,
                            ignoresActors: aoeInfo.ignoresActors,
                            requiresPath: aoeInfo.requiresPath,
                            includesOrigin: typeof aoeInfo.includesOrigin == "undefined" ? true : aoeInfo.includesOrigin,
                        }))

                        env.rpg.markedPreviewTileClasses.push(aoeInfo.addClass)
                    }
                }

                if(action?.stats?.extraAOE) for (const aoeName in action.stats.extraAOE) {
                    const aoeInfo = action.stats.extraAOE[aoeName]
                    handleExtraAOE(aoeInfo)
                }

                if(actor.extraAOEFromStatuses) actor.extraAOEFromStatuses.forEach(aoeInfo => {
                    handleExtraAOE(aoeInfo)
                })
            })

            el.addEventListener('mouseleave', function(){
                if(env.rpg.markedPreviewTiles) { 
                    env.rpg.markedPreviewTiles.forEach(tile => tile.classList.remove(... env.rpg.markedPreviewTileClasses)) 
                    env.rpg.markedPreviewAction = false
                }
            })
        }
    })
};

window.enemyTurn = function enemyTurn(enemy) {
    //determine target pools
    //enemy/ally is relative to the player's POV, i.e. "enemy" are enemy's allies

    //TODO: fold this into Vhoff's pools?
    var targetPools = {
        enemy_dead: env.rpg.enemyTeam.members.filter(actor => actor.state == "dead"),
        enemy_alive: env.rpg.enemyTeam.members.filter(actor => (actor.state != "dead") && (actor.slug != enemy.slug)),
        enemy_all: env.rpg.enemyTeam.members.filter(actor => (actor.slug != enemy.slug)),

        ally_alive: env.rpg.allyTeam.members.filter(actor => actor.state != "dead"),
        everyone_alive: env.rpg.allyTeam.members.concat(env.rpg.enemyTeam.members)
    };

    let priority = env.rpg.allyTeam.members.filter(actor=>actor.priorityTarget && actor.state != "dead");
    if(priority.length) {
        targetPools.ally_alive = priority;
    }

    //if the enemy has a special per-turn check, execute it here
    var shouldBreak = false;
    if(enemy.turnCheck) { shouldBreak = env.COMBAT_TURNCHECKS[enemy.turnCheck](enemy, {targets: targetPools}); }
    if(shouldBreak) return;

    if(enemy.firmSkip) {
        setTimeout(()=>advanceTurn(enemy, {ignoreTime: true}), env.ADVANCE_RATE * 0.5)

        if(env.rpg.is2D) {
            enemy.highlight("piece")
        }

        return
    }

    //redirect to alternate system if needed
    if(env.rpg?.is2D) return env.rpg.enemyTurn(enemy);

    //proceed with action selection
    //if the enemy has the 'windup' status, draw from windupActions instead
	//corruuuuuuu whyyyyyyyy :(
    let actionNamePool = enemy.actions;
    let actions = [
        [["windup", "windup_telegraph_flat"], "windupActions"],
        [['winderup'], "winderupActions"],
        [["windestup"], "windestupActions"],
        [["final_windup"], "finalWindupActions"],
        [["windup_aim"], "aimingActions"]
    ];
    for (const action of actions) {
        if (enemy[action[1]]) {
            if (action[0].some(x=>hasStatus(enemy, x))) {
                actionNamePool = enemy[action[1]];
            }
        }
        else {
            action[0].forEach(x=>removeStatus(enemy, x));
        }
    }

    //TODO: does this need to be here? -ARRHY
    enemy.statusEffects.forEach(status => {
        if(status.grantsActions) {
            actionNamePool = actionNamePool.concat(status.grantsActions)
        }
    })

	//sola edit, give enemies their items as actions (thanks sola :D)
    Ust.addEnemyItemActions(enemy, actionNamePool);

    let actionPool = [];
    actionNamePool.forEach(actionName => {
        let action = env.ACTIONS[actionName];
        let usable = true;

        //action-based disable checks
        if(action.enemyUsageIf) usable = action.enemyUsageIf(enemy);
        if(usable && action.disableIf) usable = !action.disableIf(enemy);

        //avoidChaining filtering - some abilities shouldn't be used repeatedly
        if(enemy.lastUsed) 
            if(enemy.lastUsed.avoidChaining && (action.slug == enemy.lastUsed.slug))
                usable = false;

        //last man standing support skill avoidance
        //basically, if they're the last guy trying to use an ally non-self buff, try to pick an attack or self-buff instead
        if(
            targetPools.enemy_alive.length == 0 &&
            (
                action.type.includes('support') && 
                !action.type.includes('self') &&
                !action.type.includes("rez")
            )
        ) usable = false;

        //if it has a targetFilter and there's no actor in the env.rpg.turnOrder that fits the bill
        if(usable && action.targetFilter) {
            let filteredTargets = env.rpg.turnOrder.filter(actor => action.targetFilter(enemy, actor))
            if(!filteredTargets.length) usable = false
            else action.filteredTargets = filteredTargets // briefly store filtered targets on action. this sucks
        }
        
        if(usable) actionPool.push(action);
    })

    let action = actionPool.length ? actionPool.sample() : env.ACTIONS["nothing"];

    //TODO: does this need overrides? -ARRHY
    var target
    if(action.filteredTargets) {
        target = action.filteredTargets.sample()
        delete action.filteredTargets
    } else {
        if(action.type.includes('self')) {
            targetPools.enemy_alive.push(enemy)
            targetPools.everyone_alive.push(enemy)
        }

        if(action.type.includes('random')) {
            target = targetPools.everyone_alive.sample()
        } else if (action.type.includes('rez') && action.type.includes('support')) {
            target = targetPools.enemy_all.sample()
        } else if (action.type.includes('rez')) {
            target = targetPools.enemy_dead.sample()
        } else if (action.type.includes('support')) {
            target = targetPools.enemy_alive.sample()
        } else {
            target = targetPools.ally_alive.sample()
        }
    }

    var executionTime = env.ADVANCE_RATE * 0.5;
    setTimeout(()=>{
        try {
            switch(action.type.includes('special')) {					
                case true:
                    useAction(enemy, action, target);
					
					// sola edit
                    Ust.actorItemUseCheck(enemy, action.slug);
                    break;

                default: 
                    var hit = useAction(enemy, action, target);
                    setTimeout(()=>advanceTurn(enemy), (env.ADVANCE_RATE * 1.5) + (enemy?.advanceTimeModifier ? enemy.advanceTimeModifier : 0));
					// sola edit
                    Ust.actorItemUseCheck(enemy, action.slug);
					
                    switch(hit) {
                        case null: case "nothing":
                            break;
                        case "crit":
                            reactDialogue(enemy, 'crit');
                            break;
                        case true:
                            reactDialogue(enemy, 'hit');
                            break;
                        case false:
                            reactDialogue(enemy, 'miss');
                            break;
                    }					
            }
        } catch(e) {printError(e); printError('proceeding to next turn', false); setTimeout(()=>advanceTurn(enemy), env.ADVANCE_RATE); }
        //actor.history.push(action)
    }, executionTime);
};
