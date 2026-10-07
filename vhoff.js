// i was lazy to remove the original documentation, so enjoy the plainly copy-pasted stuff - MERAGE

// put this somewhere better -ATHIE
{
    oldSample = Array.prototype.sample;
    Object.defineProperty(Array.prototype, "sample", {
        value: oldSample,
        writable: false,
        enumerable: false,
        configurable: false
    });
}


//initialise namespace for modding library -ARRHY
window.Vhoff ??= {};

//funny easter egg names -ARRHY
window.RGT ??= window.Vhoff;
window.FLEGM ??= window.Vhoff;

Vhoff.baseHumors ??= [ //you know 'em, you love 'em -ARRHY
    "claws",
    "eyes",
    "ichor",
    "light",
    "bone",
];

// addResources([Ochem.modLoc+"css/vhoff.css"]); - havent figured out the addResources stuff yet

['log', 'warn', 'error'].forEach(m=>{
    Vhoff[m] = function(...elements){ console[m]("%c[VHF]", 'color: #66ff66; font-style: italic;', "::", ...elements); }
});

Vhoff.errorReadout = function(...texts){
    if (!texts.length){ return; }
    chatter({actor: 'actual_vhoff_error', text:texts[0], readout: true});
    setTimeout(()=>{ Vhoff.errorReadout(...texts.slice(1)); }, 250);
}

Vhoff.LOADERS ??= {};

Vhoff.localeText ??= {};

// Vhoff.about = ()=>{Vhoff.log(`
//     ::/VHOFF/
//     'third-party modification';'by arrhenia et al.'
//     EXPLICIT PURPOSE::'library mod';'used for modding ::/FRAME/'
//     INHERITED CONTEXT::'archdaemons used for interfering with framing devices';'such awesome power used for such a silly purpose..'
// `)};
//TODO: idk if i want this but it's kinda funny, thanks adenator -ARRHY

Vhoff.registerLoader = function(id, func, dependencies) {
    Vhoff.LOADERS[id] = {
        loaded: false,
        dependencies: dependencies ?? [],
        func
    };
}

Vhoff.load = function(id) {
    let loader = Vhoff.LOADERS[id];
    if (!loader){
        Vhoff.error(`Unknown loader '${id}' called!`);
        return;
    }
    try {
        if (!loader.loaded) {
            loader.loaded = true;
            for (const x of loader.dependencies) {
                Vhoff.load(x);
            }
            loader.func();
        }
    } catch (e) {
        Vhoff.errorReadout(`Caught error '${e}' in loader '${id}'!`);
        loader.loaded = false;
    }
}

Vhoff.FAMILIES ??= {};
Vhoff.FAMILIES.ACTIONS ??= {};
Vhoff.FAMILIES.STATUS_EFFECTS ??= {};
                                     // ↓ this "zero or more" is good for stuff like HOWITZER that can take 'empty' slugs -ARRHY
Vhoff.FAMILY_REGEX = /^(.+?)__family__(.*)$/;

Vhoff.FAMILY_HANDLER_FROM_OBJ = function(handleObj, familyType){
    return {
        get(target, prop, reciever) {
            let match = prop.match(Vhoff.FAMILY_REGEX);
            if (match){
                let func = handleObj[match[1]];
                if (func){
                    let ret = func(match[2], prop);
                    if (!ret) {
                        Vhoff.errorReadout(`Error in ${familyType} family ${match[1]} with parameters ${match[2]}; returned `,ret);
                        return null;
                    }
                    ret.slug = prop; //just in case -ARRHY
                    //TODO: maybe factor out all the "convenient defaults" registerAction / registerStatus define somewhere.. -ARRHY
                    return ret;
                }
                else {
                    Vhoff.errorReadout(`Can't find ${familyType} family ${match[1]}`)
                }
            }
            return Reflect.get(...arguments);
        },
        set(obj, prop, value) {
            let match = prop.match(Vhoff.FAMILY_REGEX);
            if (match && (match[1] in handleObj)){
                Vhoff.error(`Can't override member of ${familyType} family '${match[1]}'!`);
                return false;
            }
            obj[prop] = value;
            return true;
        }
    };
}

Vhoff.proxyObjects = function(){
    Vhoff.log('proxying objects');
    env.ACTIONS = new Proxy(env.ACTIONS, Vhoff.FAMILY_HANDLER_FROM_OBJ(Vhoff.FAMILIES.ACTIONS, 'action'));
    env.STATUS_EFFECTS = new Proxy(env.STATUS_EFFECTS, Vhoff.FAMILY_HANDLER_FROM_OBJ(Vhoff.FAMILIES.STATUS_EFFECTS, 'status effect'));
}

Vhoff.registerAction = function(slug, obj){
    //TODO: add more convenient defaults to this thing -ARRHY
    //TODO: maybe factor out all the "convenient defaults" registerAction defines somewhere.. -ARRHY
    let newObj = {...obj}
    newObj.slug = slug;
    newObj.details ??= {};
    newObj.usage ??= {};
    let thisLocaleText = Vhoff.localeText[`action:${slug}`];
    if (thisLocaleText){
        newObj.name ??= thisLocaleText.name;
        newObj.details.flavor ??= thisLocaleText.flavor;
        newObj.details.conditional ??= thisLocaleText.events; //we do all the events by overloading conditional for ease of use -ARRHY
        newObj.usage.act  ??= thisLocaleText.usage?.act ;
        newObj.usage.hit  ??= thisLocaleText.usage?.hit ;
        newObj.usage.crit ??= thisLocaleText.usage?.crit;
        newObj.usage.miss ??= thisLocaleText.usage?.miss;
    }
    if (env.ACTIONS[slug]){
        Vhoff.warn(`Overriding action ${slug}...`);
    }
    env.ACTIONS[slug] = newObj;
    return newObj;
}


Vhoff.registerAugment = function(slug, obj, actorSlug = 'generic'){
    //TODO: add more convenient defaults to this thing -ARRHY
    let newObj = {...obj}
    newObj.slug = slug;
    newObj.cost ??= 2;
    let thisLocaleText = Vhoff.localeText[`augment:${slug}`];
    if (thisLocaleText){
        newObj.name ??= thisLocaleText.name;
		newObj.description ??= thisLocaleText.description;
    }
	env.ACTOR_AUGMENTS[actorSlug] ??= {};
    if (env.ACTOR_AUGMENTS[actorSlug][slug]){
        Vhoff.warn(`Overriding "${actorSlug}"'s augment ${slug}...`);
    }
    env.ACTOR_AUGMENTS[actorSlug][slug] = newObj;
    return newObj;
}

Vhoff.registerReactionPersonalities = function(slug, obj, actorSlug = 'generic'){
    //TODO: add more convenient defaults to this thing -ARRHY
    let thisActor = env.COMBAT_ACTORS[actorSlug];
    if (!thisActor){
        Vhoff.error(`Tried to register reaction personalities for nonexistent actor '${actorSlug}'!`);
        return;
    }
    let newObj = {...obj};

    thisActor.reactionPersonalities ??= {};
    if (thisActor.reactionPersonalities[slug]){
        Vhoff.warn(`Overriding ${actorSlug}'s reaction personalities for ${slug}...`);
    }
    
    thisActor.reactionPersonalities[slug] = newObj;
    return newObj;
}

Vhoff.registerHumor = function(slug, obj){
    //TODO: add more convenient defaults to this thing -ARRHY
    let newObj = {...obj}
    newObj.slug = slug;
    // newObj.details ??= {};
    // newObj.usage ??= {};
    // let thisLocaleText = Vhoff.localeText[`action:${slug}`];
    // if (thisLocaleText){
    //     newObj.name ??= thisLocaleText.name;
    //     newObj.details.flavor ??= thisLocaleText.flavor;
    //     newObj.details.conditional ??= thisLocaleText.events; //we do all the events by overloading conditional for ease of use -ARRHY
    //     newObj.usage.act  ??= thisLocaleText.usage?.act ;
    //     newObj.usage.hit  ??= thisLocaleText.usage?.hit ;
    //     newObj.usage.crit ??= thisLocaleText.usage?.crit;
    //     newObj.usage.miss ??= thisLocaleText.usage?.miss;
    // }
    if (env.COMBAT_COMPONENTS[slug]){
        Vhoff.warn(`Overriding humor ${slug}...`);
    }
    env.COMBAT_COMPONENTS[slug] = newObj;
    return newObj;
}


Vhoff.registerCombatActor = function(slug, obj){
    //TODO: add more convenient defaults to this thing -ARRHY
    let newObj = {...obj}
    newObj.slug = slug;
    // newObj.details ??= {};
    // newObj.usage ??= {};
    // let thisLocaleText = Vhoff.localeText[`action:${slug}`];
    // if (thisLocaleText){
    //     newObj.name ??= thisLocaleText.name;
    //     newObj.details.flavor ??= thisLocaleText.flavor;
    //     newObj.details.conditional ??= thisLocaleText.events; //we do all the events by overloading conditional for ease of use -ARRHY
    //     newObj.usage.act  ??= thisLocaleText.usage?.act ;
    //     newObj.usage.hit  ??= thisLocaleText.usage?.hit ;
    //     newObj.usage.crit ??= thisLocaleText.usage?.crit;
    //     newObj.usage.miss ??= thisLocaleText.usage?.miss;
    // }
    if (env.COMBAT_ACTORS[slug]){
        Vhoff.warn(`Overriding combat actor ${slug}...`);
    }
    env.COMBAT_ACTORS[slug] = newObj;
    return newObj;
}

//note to future users: this should only be used if you're making "copies" of another combat actor
//if you want to create a "class" of combat actors, do it manually -ARRHY

Vhoff.registerCombatActorDerives = function(newSlug, oldSlug, alterations){
    alterations ??= {};
    if (!env.COMBAT_ACTORS[oldSlug]){
        Vhoff.errorReadout(`Combat actor '${oldSlug}' not defined in combat actor ${newSlug} definition! Maybe a dependency is unset?`);
        return;
    }

    let newObj;

    if (alterations instanceof Function){
        newObj = Object.assign({}, env.COMBAT_ACTORS[oldSlug], alterations(env.COMBAT_ACTORS[oldSlug]));
    } else {
        newObj = Object.assign({}, env.COMBAT_ACTORS[oldSlug], alterations);
    }

    return Vhoff.registerCombatActor(newSlug, newObj);
}

Vhoff.registerHumorLoader = function(slug, obj, deps) {
    let callback;

    if (obj instanceof Function){
        callback = ()=>{Vhoff.registerHumor(slug, obj())};
    } else {
        callback = ()=>Vhoff.registerHumor(slug, obj);
    }

    Vhoff.registerLoader(
        "humor:" + slug,
        callback,
        deps
    );
}


Vhoff.registerActionLoader = function(slug, obj, deps) {
    let callback;

    if (obj instanceof Function){
        callback = ()=>{Vhoff.registerAction(slug, obj())};
    } else {
        callback = ()=>Vhoff.registerAction(slug, obj);
    }

    Vhoff.registerLoader(
        "action:" + slug,
        callback,
        deps
    );
}


Vhoff.registerCombatActorLoader = function(slug, obj, deps) {
    let callback;

    if (obj instanceof Function){
        callback = ()=>{Vhoff.registerCombatActor(slug, obj())};
    } else {
        callback = ()=>Vhoff.registerCombatActor(slug, obj);
    }

    Vhoff.registerLoader(
        "combat_actor:" + slug,
        callback,
        deps
    );
}

Vhoff.registerCombatActorDerivesLoader = function(newSlug, oldSlug, alterations, deps){
    let callback;

    callback = ()=>{
        Vhoff.registerCombatActorDerives(newSlug, oldSlug, alterations);
    };

    deps ??= [];
    deps.push(`combat_actor:${oldSlug}`); //just in case -ARRHY

    Vhoff.registerLoader(
        "combat_actor:" + newSlug,
        callback,
        deps
    );
}

Vhoff.registerStatusEffect = function(slug, obj){
    //TODO: add more convenient defaults to this thing -ARRHY
    //TODO: maybe factor out all the "convenient defaults" registerStatus defines somewhere.. -ARRHY
    let newObj = {...obj}
    newObj.slug = slug;
    if (env.STATUS_EFFECTS[slug]){
        Vhoff.warn(`Overriding status effect ${slug}...`);
    }
    env.STATUS_EFFECTS[slug] = newObj;
    return newObj;
}

Vhoff.registerStatusEffectLoader = function(slug, obj, deps) {
    let callback;

    if (obj instanceof Function){
        callback = ()=>{Vhoff.registerStatusEffect(slug, obj())};
    } else {
        callback = ()=>Vhoff.registerStatusEffect(slug, obj);
    }

    Vhoff.registerLoader(
        "status_effect:" + slug,
        callback,
        deps
    );
}

Vhoff.registerActionFamily = function(familyName, func){
    if (familyName in Vhoff.FAMILIES.ACTIONS){
        Vhoff.warn(`Overriding action family '${familyName}'; is this intentional?`);
    } else {
        Vhoff.log(`Registering action family '${familyName}'...`);
    }
    Vhoff.FAMILIES.ACTIONS[familyName] = func;
    return;
}

Vhoff.registerActionFamilyLoader = function(familyName, func, deps) {
    Vhoff.registerLoader(
        "action_family:" + familyName,
        () => Vhoff.registerActionFamily(familyName, func),
        deps
    );
}

Vhoff.registerStatusEffectFamily = function(familyName, func){
    if (familyName in Vhoff.FAMILIES.STATUS_EFFECTS){
        Vhoff.warn(`Overriding status effect family '${familyName}'; is this intentional?`);
    } else {
        Vhoff.log(`Registering status effect family '${familyName}'...`);
    }
    Vhoff.FAMILIES.STATUS_EFFECTS[familyName] = func;
    return;
}

Vhoff.registerStatusEffectFamilyLoader = function(familyName, func, deps) {
    Vhoff.registerLoader(
        "status_effect_family:" + familyName,
        () => Vhoff.registerStatusEffectFamily(familyName, func),
        deps
    );
}

Vhoff.registerCombatModifierFromStatus = function (humor, slug, ...additions){
    Vhoff.log('autoregistering combat modifier', slug);
    let alts = [ ["STATUS", slug] ];

    if(additions && additions.length){
        alts = alts.concat(additions);
    }

    env.MODIFIERS[slug] = {
        name: env.STATUS_EFFECTS[slug].name,
        getHelp: ()=> { return env.STATUS_EFFECTS[slug].help },
        getStatus: ()=> { return env.STATUS_EFFECTS[slug] },
        alterations: { 
            all: alts
        }
    };

    if (humor){ // autoregister combat modifiers
        if (!env.COMBAT_COMPONENTS[humor].combatModifiers){
            env.COMBAT_COMPONENTS[humor].combatModifiers = [];
        }
        if (!env.COMBAT_COMPONENTS[humor].combatModifiers.includes(slug)){
            env.COMBAT_COMPONENTS[humor].combatModifiers.push(slug);
        }
    }

    env.STATUS_EFFECTS[slug].passive = 'modifier'; //makes sure this has the right property
}

Vhoff.registerItem = function(slug, obj){
    //TODO: add more convenient defaults to this thing -ARRHY
    
    let newObj = {...obj}
    newObj.slug = slug;
    if (env.ITEM_LIST[slug]){
        Vhoff.warn(`Overriding item ${slug}...`);
    }
    env.ITEM_LIST[slug] = newObj;
    return newObj;
}

Vhoff.registerFish = function(slug, obj){
    //TODO: add more convenient defaults to this thing -ARRHY
    
    let newObj = {...obj}
    newObj.slug = slug;
    if (FishingMinigame.fishies[slug]){
        Vhoff.warn(`Overriding fish ${slug}...`);
    }
    FishingMinigame.fishies[slug] = newObj;
    return newObj;
}

Vhoff.registerCombatFormation = function(slug, obj){
    //TODO: add more convenient defaults to this thing -ARRHY
    
    let newObj = {...obj}
    newObj.slug = slug;
    if (env.COMBAT_FORMATIONS[slug]){
        Vhoff.warn(`Overriding combat formation ${slug}...`);
    }
    env.COMBAT_FORMATIONS[slug] = newObj;
    return newObj;
}

Vhoff.registerLoopModifier = function(slug, obj){
    //TODO: add more convenient defaults to this thing -ARRHY
    
    let newObj = {...obj}
    newObj.slug = slug;
    if (env.MODIFIERS[slug]){
        Vhoff.warn(`Overriding loop modifier ${slug}...`);
    }
    env.MODIFIERS[slug] = newObj;
    return newObj;
}

Vhoff.crittaMaps = {
    boss: (formationSlug, specialSlug)=>(()=>{
        if (!env.COMBAT_FORMATIONS[formationSlug]){
            Vhoff.errorReadout(`Unknown combat formation '${formationSlug}' in boss loader!`);
            return;
        }

        env.crittaMap.currentRowSetting = [
            {
                count: 1,
                difficulties: ["4"]
            },
            {
                count: 1,
                difficulties: ["3"]
            },
        ];

        env.crittaMap.setAttribute("special", specialSlug ?? "boss"); //afaik this doesn't *have* to be intrusive, just truthy -ARRHY

        setTimeout(()=>{
            env.crittaMap.querySelector('critta-node[difficulty="3"]').formation = env.COMBAT_FORMATIONS[formationSlug];
        }, 800)
    })
}


//offers MULTIPLE CHOICES AT ONCE! with radio buttons!
//'choiceText' is a string, it's the text at the top of the choice
//'options' is an array of objects:
//	{text: what the button says
//   definition: mouseover text
//   height: grid height (default 1)
//   width: grid width (default 1)
// 	 x: grid x (default 1 or last (1-indexed) (left to right))
// 	 y: grid y (default 1 or last+1 (top to bottom))
//   slug: string uniquely identifying the choice
//   disableIf: function taking in chosenSlugs (list of currently chosen slugs).
//              return a truthy value to disable + override the definition.
//				disabled buttons are automatically deselected
//   deselect: logic for deselecting other buttons when this button is pressed.
//	           can be "sameColumn", "sameRow", a list of choice slugs, or a filter function.
//}
//'columns' is an optional array of:
//		text: what the column header says
//		definition: mouseover text
//		span: how many columns the text spans (default 1)
//		pos: which column index (1-indexed (left-to-right)) (default last+1)
//'rows' is an optional array (row headers)
//'finalText' is what the FINALIZE button is called
//'disableFinal' is the same as disableIf above
//'choiceCallback' is what to do after a choice is made, all chosen slugs are passed in as an array
//'clickCallback' is what to do when a choice is clicked; all slugs and the slug clicked are passed in
//'user' is the user actor object
//'action' is the action object for references to animations
//'preselect' is a list of slugs to have preselected
//'previewResult' is a function, like clickCallback, that controls the preview object
//	if it's unset, the preview object isn't even constructed
// -ARRHY

Vhoff.actionMultiChoice = function({
    choiceText = "choice",
    options = [],
    columns = [],
    rows = [],
    finalText = 'FINALIZE',
    disableFinal,
    choiceCallback,
    clickCallback,
    previewResult,
    user,
    action,
    preselect
}) {
    if(action.choiceAnim) {user.sprite.classList.add(action.choiceAnim)};
    let id = `${user.slug}-${action.slug}`;

    //preliminary column/row count checks
    let columnCount = columns.length;
    let rowCount = rows.length;

    //how many empty slots from the start?
    let columnBias = 0;
    if (rows.length){ columnBias = 1; }
    let rowBias = 0;
    if (columns.length){ rowBias = 1; }

    let currentX = 1;
    let currentY = 1;
    let buttonHTML = options.map(opt=>{
        let x = (opt.x ?? currentX);
        let y = (opt.y ?? currentY);

        opt.calcX = x;
        opt.calcY = y;

        let xSpan = (opt.width ?? 1);
        let ySpan = (opt.height ?? 1);

        opt.calcXSpan = xSpan;
        opt.calcYSpan = ySpan;

        columnCount = Math.max(columnCount, x+xSpan-1);
        rowCount = Math.max(rowCount, y+ySpan-1); //i fucking guess -ARRHY

        currentX = x;
        currentY = y + ySpan;

        x += columnBias;
        y += rowBias;
        if (opt.definition){
            return `<div choice="${opt.slug}" class="button" style="grid-row: ${y} / ${y+ySpan}; grid-column: ${x} / ${x+xSpan};" definition="${opt.definition}">${opt.text}</div>`
        } else {
            return `<div choice="${opt.slug}" class="button" style="grid-row: ${y} / ${y+ySpan}; grid-column: ${x} / ${x+xSpan};">${opt.text}</div>`
        }
    }).join('\n'); //this kinda sucks tbh -ARRHY

    currentX = 1;

    let columnHTML = columns.map(col=>{
        let x = (col.x ?? currentX);

        let xSpan = (col.span ?? 1);

        currentX = x + xSpan;

        x += columnBias;			

        return `<div class="column-header" style="grid-row: 1 / 2; grid-column: ${x} / ${x+xSpan};" definition="${col.definition}">${col.text}</div>`
    }).join('\n'); //this kinda sucks tbh -ARRHY

    currentY = 1;

    let rowHTML = rows.map(row=>{
        let y = (row.y ?? currentY);

        let ySpan = (row.span ?? 1);

        currentY = y + ySpan;

        y += rowBias;			

        return `<div class="row-header" style="grid-column: 1 / 2; grid-row: ${y} / ${y+ySpan};" definition="${row.definition}">${row.text}</div>`
    }).join('\n'); //this kinda sucks tbh -ARRHY

    let gridStyle = `
        grid-template-columns: repeat(${columnCount+!!rows.length},auto);
        grid-template-rows: repeat(${rowCount+!!columns.length},auto);
    `
    let previewHTML = '';
    if (previewResult){
        previewHTML = '<span class="button choice-preview"></span>'
    }

    // console.log(choices)
    env.rpg.insertAdjacentHTML('beforeend', `
        <div id="${id}" class="choice-multi">
            <div class="choice-title">${choiceText}</div>
            <div class="choice-grid" style="${gridStyle}">
                ${columnHTML}
                ${rowHTML}
                ${buttonHTML}
            </div>
            <div class="choice-bottom">
                <span class="button choice-finalise">${finalText}</span>
                ${previewHTML}
            </div>
        </div>
    `);

    let buttonNodes = [...env.rpg.querySelectorAll(`#${id}.choice-multi .choice-grid .button`)];

    let finaliseButton = env.rpg.querySelector(`#${id}.choice-multi .button.choice-finalise`);

    let getSelected = ()=>{
        return buttonNodes.filter(el=>el.classList.contains('selected') && !el.classList.contains('disabled'))
            .map(el=>el.getAttribute('choice'));
    }

    let recalculateDisabled = ()=>{
        let currentlySelected = getSelected();
        buttonNodes.forEach(el=>{
            if (!el.choiceOpt.disableIf){ return; }
            let disable = el.choiceOpt.disableIf(currentlySelected);
            if (disable){
                el.classList.add('disabled');
                el.classList.remove('selected');
                el.setAttribute('definition', disable);
            } else {
                el.classList.remove('disabled');
                if (el.choiceOpt.definition){
                    el.setAttribute('definition', el.choiceOpt.definition);
                } else {
                    el.removeAttribute('definition');
                }
            }
        });

        if (!disableFinal){ return; }
        let disable = disableFinal(currentlySelected);
        if (disable){
            finaliseButton.classList.add('disabled');
            finaliseButton.classList.remove('selected');
            finaliseButton.setAttribute('definition', disable);
        } else {
            finaliseButton.classList.remove('disabled');
            finaliseButton.removeAttribute('definition');
        }
    };

    buttonNodes.forEach(el=>{
        let thisSlug = el.getAttribute('choice');
        let thisOpt = options.filter(opt=>opt.slug == thisSlug)[0];
        el.choiceOpt = thisOpt;
        thisOpt.el = el;
        el.addEventListener('click', ()=>{
            Ochem.log('clicking on', el);
            if (el.classList.contains('disabled')){ return; }
            if (el.classList.contains('selected')){
                el.classList.remove('selected');
                recalculateDisabled();
            } else {
                Ochem.log('adding selected');
                if (thisOpt.deselect){ //TODO: refactor? -ARRHY
                    if (thisOpt.deselect == 'all'){
                        buttonNodes.forEach(nd=>{
                            nd.classList.remove('selected');
                        });
                    }
                    if (thisOpt.deselect == 'sameColumn'){
                        buttonNodes.filter(nd=>nd.choiceOpt.calcX == thisOpt.calcX).forEach(nd=>{
                            nd.classList.remove('selected');
                        });
                    }
                    if (thisOpt.deselect == 'sameRow'){
                        buttonNodes.filter(nd=>nd.choiceOpt.calcY == thisOpt.calcY).forEach(nd=>{
                            nd.classList.remove('selected');
                        });
                    }
                    if (typeof thisOpt.deselect == 'function'){
                        buttonNodes.filter(nd=>thisOpt.deselect(nd.choiceOpt)).forEach(nd=>{
                            nd.classList.remove('selected');
                        });
                    }
                    if (typeof thisOpt.deselect == 'object'){
                        buttonNodes.filter(nd=>thisOpt.deselect.includes(nd.choiceOpt.slug)).forEach(nd=>{
                            nd.classList.remove('selected');
                        });
                    }
                }
                el.classList.add('selected');
                recalculateDisabled();
            }
            if (clickCallback){
                clickCallback(getSelected(), thisSlug);
            }
            if (previewResult){
                previewResult(getSelected(), document.querySelector(`#${id} .choice-bottom .choice-preview`));
            }
        });
    });

    finaliseButton.addEventListener('click', ()=>{
        if (finaliseButton.classList.contains('disabled')){ return; }

        let currentlySelected = getSelected();

        document.querySelector(`#${id}`).remove();
        if(action.choiceAnim) {user.sprite.classList.remove(action.choiceAnim);}

        //so this happens after the fade back from the offer animation    
        //the choice should be acted upon somehow, likely through a switch        
        setTimeout(()=>choiceCallback(currentlySelected), action.choiceAnimDuration || 1)
    });

    //TODO: maybe refactor this
    if (preselect && preselect.length){
        preselect.forEach(slug=>{
            let thisOpt = options.filter(opt=>opt.slug == slug)[0];
            thisOpt.el.classList.add('selected');
        });
    }

    recalculateDisabled();
    if (previewResult){
        previewResult(getSelected(), document.querySelector(`#${id} .choice-bottom .choice-preview`));
    }
}

Vhoff.isTargetable = function(actor){
    return actor && actor.state != "dead" && actor.state != "lastStand";
    //TODO: why is this like this and not like
    //return actor.state === 'living' //this? -ARRHY
}

Vhoff.filterTargetable = function(actors){
    return actors.filter(member => Vhoff.isTargetable(member));
}

//TODO: "hit random foes N times" seems to be a common pattern... -ARRHY
//TODO: this might have weird behavior on self-hits... maybe make whether self-hits count as "foes" specifiable? -ARRHY

Vhoff.hitPools = {
    all:{
        name: 'all',
        make: (user, target) => Vhoff.filterTargetable(env.rpg.turnOrder),
        randString: 'random actors',
        allString: 'all actors',
        shortString: 'all actors',
    },
    foes:{
        name: 'foes',
        make: (user, target) => {
            if (target){
                return Vhoff.filterTargetable(target.team.members);
            } else {
                return Vhoff.filterTargetable(user.enemyTeam.members);
            }
        },
        randString: 'random foes',
        allString: 'all foes',
        shortString: 'foes',
    },
    allies:{
        name: 'allies',
        make: (user, target) => {
            if (user){
                return Vhoff.filterTargetable(user.team.members);
            } else {
                return Vhoff.filterTargetable(target.enemyTeam.members);
            }
        },
        randString: 'random allies',
        allString: 'all allies',
        shortString: 'allies',
    },
    target:{
        name: 'target',
        make: (user, target)=>Vhoff.filterTargetable([target]),
        randString: 'target',
        allString: 'target',
        shortString: 'target',
    },
    otherFoes:{
        name: 'otherFoes',
        make: (user, target) => {
            if (target){
                return Vhoff.filterTargetable(target.team.members).filter(member => member !== target);
            } else {
                return Vhoff.filterTargetable(user.enemyTeam.members);
            }
        },
        randString: 'random other foes',
        allString: 'other foes',
        shortString: 'other foes',
    },
    user: {
        name: 'user',
        make: (user, target)=>Vhoff.filterTargetable([user]),
        randString: 'user',
        allString: 'user',
        shortString: 'user',
    },
    otherAllies:{
        name: 'otherAllies',
        make: (user, target) => {
            if (user){
                return Vhoff.filterTargetable(user.team.members).filter(member => member !== user);
            } else {
                return Vhoff.filterTargetable(target.enemyTeam.members);
            }
        },
        randString: 'random other allies',
        allString: 'other allies',
        shortString: 'other allies',
    },
};

for (key in Vhoff.hitPools){
    let pool = Vhoff.hitPools[key];
    pool.sample = (user, target)=>pool.make(user, target).sample();
    pool.includesActor = (user, target, actor)=>pool.make(user, target).includes(actor);
    pool.countWithState = (user, target, state)=>pool.make(user, target).filter(m=>m.state==state).length;
    pool.countDead = (user, target)=>pool.countWithState(user, target, 'dead');
    pool.countAlive = (user, target)=>pool.countWithState(user, target, 'alive');
}


//gets a shell's actions, or by index
//this should ONLY BE USED for shells (i.e. main members of your team!!)
//we know that in this case the primary/secondary/utility are GUARANTEED to be in the first/second/third slot
// in the other cases we don't! currently we're using it for all impulses but like Guhhhh this is so bad
// TODO: we need to register primaries / secondaries / utilities with some sort of extra data?
// .isPrimary..
    // i should make like . a dedicated function for this
    // oh well
//narra, in ZUKA <-- now you can! ARRHY


// TODO: in HOOK i found this code:
    // if(hasStatus(this.status.affecting, "windup") && this.status.affecting.windupActions == ["dullflare_player"]) (secondary = env.ACTIONS["dullflare_player"])
    // if(hasStatus(this.status.affecting, "windup") && this.status.affecting.windupActions == ["calculated_stab"]) (secondary = env.ACTIONS["calculated_stab"])
    // if(hasStatus(this.status.affecting, "windup") && this.status.affecting.windupActions == ["calculated_frenzy"]) (secondary = env.ACTIONS["calculated_frenzy"])
    // if(hasStatus(this.status.affecting, "windup") && this.status.affecting.windupActions == ["reconstruct"]) (secondary = env.ACTIONS["reconstruct"])
// (which doesn't work)
//so we might have to also give a list of exceptions or something - ARRHY

//TODO: i also found this code in PAIN:
    // if(user.hasWindupActions && env.ACTIONS[user.windupActions[0]] !== (env.ACTIONS.special_combinesummon || env.ACTIONS.special_combinesummon_select)) (primary = env.ACTIONS[user.windupActions[0]])
// idk what's going on there. also a number of exceptions??

// TODO: i found this code in SPIRESTONE:
    // let dullUtility = [2, 4, 4, 5, 5, 5, 6, 6, 6, 6] //vestigial variable

    // if (user.actions.includes('special_player_dullsummon_low')) {
    //     utility = env.ACTIONS[user.actions[dullUtility.sample()]]
    // }
// so we might have to roll extra times?

Vhoff.getShellActions = function(user, index) {
    let actions = [
        [["windup", "windup_telegraph_flat"], "windupActions"],
        [['winderup'], "winderupActions"],
        [["windestup"], "windestupActions"],
        [["final_windup"], "finalWindupActions"],
        [["windup_aim"], "aimingActions"]
    ];
    
    let out;

    if (user.actions){
        if (index !== undefined && user.actions[index]){
            out = user.actions[index];
        } else {
            out = user.actions;
        }
    }
    
    actions.forEach(arr=>{
        if (user[arr[1]]){
            if (arr[0].some(s=>hasStatus(user, s))){
                if (index !== undefined && user[arr[1]][index]){
                    out = user[arr[1]][index];
                } else {
                    out = user[arr[1]];
                }
            }
        }
    });

    if (!out){ return null; }
    if (index !== undefined){
        return env.ACTIONS[out];
    } else {
        return out.map(a=>env.ACTIONS[a]);
    }
}

Vhoff.getShellPrimary = (user)=>Vhoff.getShellActions(user, 0);
Vhoff.getShellSecondary = (user)=>Vhoff.getShellActions(user, 1);
Vhoff.getShellUtility = (user)=>Vhoff.getShellActions(user, 2);

Vhoff.getShellHumorQuantity = function(actor, humor){
    if(!actor?.member?.components){ return 0; }
    let power = 0;
    for (const [slotName, slotContents] of Object.entries(actor.member.components)) {
        if(!humor || slotContents == humor){ power++; }
    }

    if(actor?.member?.augments){
        for (const augmentSlug of actor.member.augments) {
            let augment = env.ACTOR_AUGMENTS.generic[augmentSlug];
            if(augment?.component){
                if(!humor || augment.component[1] == humor){
                    power += augment.cost;
                }
            }
        }
    }

    return power;

};


Vhoff.consumeStatus = function(settings) {
    if(settings.runEvents !== false) triggerStatusEvents({target: settings.target, eventName: "onBeforeConsumeStatus", context: settings })
    
    if(settings.noRemove) return false
    return Vhoff.consumeStatusLogic(settings);
}

//actual logic
Vhoff.consumeStatusLogic = function({
    target, //actor having the status consumed
    status: statusName, //status name as string
    length = 1, //number of rounds to subtract
    noUpdate,
    noReact,
    noFloater,
    runEvents = true,
    forceAdd //bypass the death limit
}) {
    if((target.state == "dead" || target.hp == 0) && !forceAdd || !env.rpg.active ) return; // can't add statuses to the dead
    if(!env.STATUS_EFFECTS[statusName]) {
        Vhoff.errorReadout(`You're trying to subtract a status that doesn't exist from ${target.name}!\n(${statusName})`);
        Vhoff.log("tried to add status right here");
        return false
    }

    length = Math.min(length, hasStatus(target, statusName)); // 5, 3 -> 3
    if (length == 0){ return; } //no action required -ARRHY
    let newDuration = -length + hasStatus(target, statusName);

    //console.log(`APPLYING ${statusName}`);
    let statusObj = {... env.STATUS_EFFECTS[statusName]}
    let effectiveStatusName = statusName
    let statusId = env.rpg.entCount++
    let extendingExistingStatus = false

    //first check for immunity. used to be a messy try catch and relies on something that might not exist (statusImmunities) so this is a stopgap until the rework
    let isImmune = false
    if(target.statusImmunities) if(target.statusImmunities.includes(statusName)) isImmune = true // old way of doing it
    if(target.immunities) if(target.immunities[statusName]) isImmune = true // new way of doing it

    if(isImmune) {
        //this should just silently change the status
        // setTimeout(()=>{
        //     env.rpg.effectMessage.action({
        //         user: origin,
        //         target: target,
        //         reason: "attention",
        //         action: `'%TARGET';'${statusName} immunity'${statusObj.substitute ? `;'substituting ${statusObj.substitute}'` : ""}`
        //     })
        // }, 20)

        if(!statusObj.substitute) return; else {
            effectiveStatusName = statusObj.substitute
            statusObj = {... env.STATUS_EFFECTS[effectiveStatusName]}
        }
    }

    //setup for effectMessage if needed
    env.rpg.effectMessage.affect({target, initializeOnly: true})

    try { 
        let existing = target.statusEffects.findIndex(existingStatus => existingStatus.slug == effectiveStatusName);
        //console.log(`    EXISTING INDEX: ${existing}`);

        if(existing >= 0) {
            //console.log(`    ADDING ${length} TO EXISTING ${effectiveStatusName}`);
            target.statusEffects[existing].duration = newDuration;
            statusObj = target.statusEffects[existing];
            //console.log(target.statusEffects);

        } else {
           Vhoff.errorReadout(`theoretically unreachable code run in consumeStatusLogic, very bad!`);
           return false;
        }

        env.rpg.querySelectorAll(`#${target.slug}-sprite-wrapper, #${target.slug} .portrait`).forEach(el=>el.classList.add(`spritestatus-${statusObj.slug}`))

        if(runEvents) triggerStatusEvents({target, eventName: "onConsumeStatus", context: {target, statusObj} });
        if(!noReact) reactDialogue(target, `consume_${statusName}`);
        if(!noUpdate) {
            updateStats({actor: target});

            if(!noFloater) sendFloater({
                target,
                type: "status",
                amt: length,
                status: statusObj
            });
        }

        statusObj.base = env.STATUS_EFFECTS[statusName];

        if(newDuration <= 0) {
            removeStatus(target, statusObj.slug);
        }

    } catch (e) { Vhoff.errorReadout(`problem in consuming ${statusName} from ${target.name} (${target.slug}): ${e}`)}

    env.rpg.effectMessage.affect({target})
    return statusObj
}

Vhoff.hasStatuses = (actor, statuses)=>{
    let qt = 0;
    statuses.forEach(status=>{
        qt += hasStatus(actor, status);
    });
    return qt;
};

//TODO: give this a proper settings object -ARRHY
Vhoff.consumeStatuses = (actor, quantity, statuses)=>{

    statuses.forEach(status=>{
        if (quantity <= 0){ return; }
        let thisqt = hasStatus(actor, status);
        let remove = Math.min(quantity, thisqt);
        Vhoff.consumeStatus({target:actor, status, length:remove});
        quantity -= remove;
    });

    return quantity; //leftover
};


Vhoff.DialogueSection = class {
    constructor(sectionName) {
        this.contents = {
            body: [],
            responses: [],
            name: sectionName
        };
        this.dialogueObj = {};
    }

    //TODO: make it so section names aren't needed anymore; pass in the section object where the name would be
    // and then automatically generate new references -ARRHY
    register(slug) {
        if (env.dialogues[slug]) {
            Vhoff.warn(`Overriding dialogue '${slug}'...`);
        }
        env.dialogues[slug] = this.dialogueObj;
        return this;
    }

    addResponse(responseObj, actor) {
        let destinationSection = responseObj.destination;

        //should be a section object or 'END', but whatever -ARRHY
        if (destinationSection && typeof destinationSection === "object") {
            const setContents = obj => obj.dialogueObj[obj.contents.name] = obj.contents;
            setContents(this);
            setContents(destinationSection);

            Object.assign(this.dialogueObj, destinationSection.dialogueObj);
            destinationSection.dialogueObj = this.dialogueObj;
            responseObj.destination = destinationSection.contents.name;
        }

        actor ??= 'self';

        let alreadyResponses = this.contents.responses.filter(r=>r.name == actor);
        if (!alreadyResponses.length){
            let newResponses = {name: actor, replies: []};
            alreadyResponses.push(newResponses);
            this.contents.responses.push(newResponses);
        }

        alreadyResponses[0].replies.push(responseObj);
        return this;
    }

    addBody(bodyObj) {
        let lastBody = this.contents.body[this.contents.body.length-1];

        bodyObj.actor ??= (lastBody?.actor ?? 'sourceless');
        if (typeof bodyObj.text == 'function'){
            bodyObj.texec = bodyObj.text;
            delete bodyObj.text;
        }

        this.contents.body.push(bodyObj);
        return this;
    }

    addBodyMultiple(bodyObj) {
        bodyObj.text.forEach(part=>{
            let newObj = {...bodyObj}
            newObj.text = part;
            this.addBody(newObj);
        });
        return this;
    }

    addBodyMultiline(bodyObj) {
        bodyObj.text = bodyObj.text.split('\n').filter(t=>t);
        this.addBodyMultiple(bodyObj);
        return this;
    }
}

Vhoff.weightList = function(els, weights){
    let outlist = [];
    for (let i = 0; i < els.length; i++) {
        let el = els[i];
        let weight = weights[i] ?? 1;
        for (let j = 0; j < weight; j++) {
            outlist.push(el);
        }
    }
    return outlist;
}

Vhoff.makeReactionsRare = function(personality, slug, weight){
    let dialogue = personality[slug];
    let stripped = dialogue.map(a=>a.startsWith('RARE::') ? a.slice(6) : a);
    let weights = dialogue.map(a=>a.startsWith('RARE::') ? 1 : weight);
    let newDialogue = Vhoff.weightList(stripped, weights);
    personality[slug] = newDialogue;
}

// // NOTE TO SELF: never do this -ARRHY
// NOTE TO SELF: past me was a coward. maybe do this -ARRHY

Vhoff.mixin = function(func, ...ops){

    Vhoff.log('Calculating function mixin on', func, "...");
    let strMatch = (func + '').match(/^(function)?(.*)(\)|=>)((\n|.)*)$/);

    if (!strMatch || !strMatch.length){
        Vhoff.error(`Error in function mixin on function`, func);
        return;
    }

    let params = strMatch[2];
    if (params.startsWith('(')){
        params = params.slice(1);
    }
    if (params.endsWith(')')){
        params = params.slice(0,-1);
    }
    params = params.split(",").map(s=>s.trim()).filter(s=>s);
    let delim = strMatch[3];
    let rest = strMatch[4].trim();

    let isLambda = !func.protoype;

    let isBlock = false;

    if (rest.startsWith("{") && rest.endsWith("}")){
        isBlock = true;
        rest = rest.slice(1,-1).trim();
    }

    // Vhoff.log(params);
    // Vhoff.log(rest);

    // Vhoff.log(isLambda);

    ops.forEach(op=>{
        rest = op(rest);
        // Vhoff.log(rest);
    });

    //if the function isn't a block function, we need to make it one;
    if (!isBlock){
        rest = 'return '+ rest;
    }

    //TODO: at some point here we need to bind the `this` keyword -ARRHY

    let newFunc = new Function(...params, rest);

    return newFunc;
}


// NOTE TO SELF::you gotta remove the comma on the last action here or else midCombatAllyAdd gets undefined for reasons unclear to me
//hey narra you're SUPPOSED TO USE SEMICOLONS NOT COMMAS that's why everything is being fucked up -ARRHY

// CUSTOM FUNCTIONS
/** @deprecated */
function midCombatAllyAdd(actorSpecifier, side = "right") {
    if(!env.rpg.active) return false;

    Vhoff.log('adding ally mid combat:', actorSpecifier);
    
    let actor = initializeActor(actorSpecifier, {team: env.rpg.allyTeam, enemyTeam: env.rpg.enemyTeam, uniqify: true, side})
    
    if(env.rpg.settings.actorPreprocess) env.rpg.settings.actorPreprocess(actor)
    if(actor.base?.events?.onInitialize) actor.base.events.onInitialize(actor)
    if(actor.alterations || env.rpg.settings.teamAlterations?.enemy || env.rpg.settings.teamAlterations?.all ) getAlteredActorActions({member: actor, actor: actor, copyPools: false})

    initializeActorUI({actor, team: env.rpg.allyTeam, side, animateIn: false})

    //update the turnorder
    env.rpg.turnOrder = []
    env.rpg.teams.forEach((team, i) => {
        env.rpg.turnOrder = env.rpg.turnOrder.concat(team.members);
    })
	
	//update current actor accordingly
    if(side == "left") {
        env.rpg.currentActorIndex = env.rpg.turnOrder.findIndex((a) => a == env.rpg.currentActor)
    }

    updateStats()
    return actor
}

/** @deprecated */
Vhoff.midCombatAllyAdd = midCombatAllyAdd;

/** @deprecated */
function midCombatAllyRemove(actor) {
    env.rpg.allyTeam.members = env.rpg.allyTeam.members.filter(a => a.slug != actor.slug)
    delete env.rpg.actors[actor.slug]

    content.querySelectorAll(`#ally-team #${actor.slug}`).forEach(el=>{
        setTimeout(()=>{
            el.remove()
        }, 1000)
    })

    //update the turnorder
    env.rpg.turnOrder = []
    env.rpg.teams.forEach((team, i) => {
        env.rpg.turnOrder = env.rpg.turnOrder.concat(team.members);
    })

    updateStats()
}

/** @deprecated */
Vhoff.midCombatAllyRemove = midCombatAllyRemove;


Vhoff.summonActorsUntil = function(team, actorPool, side, quantity=1, disableIf, fallback){
    if (typeof actorPool !== "object" || !actorPool){
        actorPool = [actorPool];
    }

    if (disableIf && typeof disableIf !== "function"){
        let disableQty = +disableIf;
        disableIf = (team)=>{return team.members.length >= disableQty};
    }

    if (disableIf && disableIf(team)){
        if (fallback){
            fallback();
        }
        return;
    }

    for (let i = 0; i < quantity; i++) {
        midCombatActorAdd(team, actorPool.sample(), side, {});
        if (disableIf && disableIf(team)){
            return;
        }
    }   
}

//TODO: refactor this further -ARRHY

Vhoff.addHumorCommerce = function(humor){
    const component = env.COMBAT_COMPONENTS[humor];
	let sellValue = 1;
	let buyValue = 5; //TODO: set this per humor? -ARRHY

    let commerceObject = {
        type: "humor",
        name: `${component.name.replace("Humor of ", "")}`,
        subject: component,
		value: 1,
        sellValue: 1,
		buyValue: 5,

		showSellIf: ()=> env.e3a2.mTotals[humor].available > 0,
        showReplySellIf: ()=> env.e3a2.mTotals[humor].available > 0,
		// showBuyIf: ()=> false,
		showReplyBuyIf: ()=>checkItem("sfer_cube",buyValue) >= buyValue,
		buyExec: function (){
			CrittaReward.safeAdd(page.flags.components, humor, 1);
			removeItem("sfer_cube", buyValue);
			env.commerceNotice = `exchanged ${buyValue} ${env.ITEM_LIST['sfer_cube'].name} for 1 ${component.name}`
		},
        sellExec: function (){
			CrittaReward.safeAdd(page.flags.components, humor, -1);
            addItem("sfer_cube", sellValue);
            env.commerceNotice = `exchanged ${component.name} for ${sellValue} ${env.ITEM_LIST['sfer_cube'].name}`
        },
    };
    if(commerceObject.sellExec) {
        env.e3a2.merchant.sellResponses.replies.push({
            name: `${commerceObject.name}::${sellValue}S`,
            destination: "sell",
            hideRead: true,
            showIf: commerceObject.showReplySellIf,
            class: `commerce-${commerceObject.type}`,
            definition: `NOTE::'exchange for ${sellValue} ${env.ITEM_LIST['sfer_cube'].name}'`,
            exec: ()=> {
                commerceObject.sellExec(); 
                env.e3a2.mTotals = CrittaMenu.getTotals();
                env.e3a2.updateExchangeScreen()
            }
        });
    }
	if(commerceObject.buyExec) {
        env.e3a2.merchant.buyResponses.replies.push({
            name: `${commerceObject.name}::${buyValue}S`,
            destination: "buy",
            hideRead: true,
            showIf: commerceObject.showReplyBuyIf,
            class: `commerce-${commerceObject.type}`,
            definition: env.COMBAT_COMPONENTS[humor].description,
            exec: ()=> {
                commerceObject.buyExec();
                env.e3a2.mTotals = CrittaMenu.getTotals();
                env.e3a2.updateExchangeScreen()
            }
        });
    }
    env.e3a2.merchant.commerce.push(commerceObject);
    Vhoff.log('added humor to commerce:', humor);
};

Vhoff.statSpan = function(originalThis){
    return `<span definition="${processHelp(originalThis.status, {caps: true})}">${originalThis.status.name}</span>`;
};

Vhoff.statusReadout = function(func, originalThis, overrides){
    let effectEl = Vhoff.statSpan(originalThis);
    let message;
    if (typeof func == 'string'){
        message = func + ` (${effectEl})`;
    } else {
        message = func(effectEl);
    }

    let base = {
        message, 
        name: "sourceless", 
        type: "sourceless combat minordetail", 
        show: false,
        sfx: false
    };
    if (overrides){
        Object.assign(base, overrides);
    }
    
    readoutAdd(base);
};

//more complex addResources call
//takes multiple lists of resources to add; each list's members are loaded in parallel and the lists themselves are loaded sequentially
//final element can also be a callback if needed
Vhoff.addResources = function(...resourceLists){
    if (!resourceLists.length){
        // Vhoff.log('load finished');
        return;
    }
    if (resourceLists.length == 1 && resourceLists[0] instanceof Function){
        // Vhoff.log('running callback');
        setTimeout(resourceLists[0]);
        return;
    }
    let origLength = resourceLists[0].length;
    if (!origLength){
        // Vhoff.warn('nothing in this resource list?');
        setTimeout(()=>{
            Vhoff.addResources(...resourceLists.slice(1));
        });
        return;
    }
    let hasLoadedCount = 0;
    resourceLists[0].forEach(resource=>{
        // Vhoff.log('attempting to load', resource);
        setTimeout(()=>{
            addResources([
                resource, //fun trick; we can attach a callback to loading like this:
                ['dummy',()=>{
                    hasLoadedCount++;
                    if (origLength == hasLoadedCount){
                        setTimeout(()=>{
                            Vhoff.addResources(...resourceLists.slice(1));
                        });
                    }
                    return false;
                }]
            ]);
        });
    });
    return;
}

Vhoff.addTheFuckingStatusIAmNotAsking = function(actor, status, length){
	let existing = target.statusEffects.findIndex(existingStatus => existingStatus.slug == status);
	let statusObj = {... env.STATUS_EFFECTS[status]};
	let statusId = env.rpg.entCount++;
	let extendingExistingStatus = false;
	//console.log(`    EXISTING INDEX: ${existing}`);

	if(existing >= 0) {
		//console.log(`    ADDING ${length} TO EXISTING ${effectiveStatusName}`);
		target.statusEffects[existing].duration += length;
		statusObj = target.statusEffects[existing];
		//console.log(target.statusEffects);

	} else {
		//console.log(`    CREATING NEW ${effectiveStatusName} FOR ${length} TURNS`);
		statusObj.id = statusId;
		statusObj.duration = length;
		statusObj.origin = target; // default to assuming target self-applied
		statusObj.affecting = target;

		//to avoid ticking on own turn (thanks @brightcousinkuvi)
		statusObj.justCreated = (statusObj.affecting == statusObj.origin);
		//also prevents redirection scam-like incidents where a turn of redirection is wasted on an ally phase
		if(!statusObj.justCreated && statusObj.delayFirstTickForActorsOnTheRight) {
			if(
				env.rpg.turnOrder.findIndex((m)=> m == statusObj.origin) <
				env.rpg.turnOrder.findIndex((m)=> m == statusObj.affecting)
			) statusObj.justCreated = true;
		}
		target.statusEffects.push(statusObj);
	}

	updateStats({actor});
}

// // ::/LITERALLY_TOO_MANY_HUMORS/SIDELOADER/
// // 'third-party modification';'by adenator';'sideloader'
// if (typeof rchvst === "undefined" || !rchvst.mods.includes("literallytoomanyhumors")) {
//     Vhoff.log("ATTENTION::'literally too many humors not loaded';'sideloading'");
//     addResources(["https://adenator.nekoweb.org/corrumod/literallyTooManyHumors.js"]);
// }

//we need to do this because otherwise we get duplicate sell replies and no buy replies -ARRHY
Vhoff.modifyCommerce = function(){
    env.e3a2.merchant.commerce = env.e3a2.merchant.commerce.filter(item=>{
        if (!item.subject?.slug){ return true; }
        if (Vhoff.baseHumors.includes(item.subject.slug)){ return false; }
        return true;
    });
    env.e3a2.merchant.sellResponses.replies = env.e3a2.merchant.sellResponses.replies.filter(r=>{
        return r.class !== `commerce-humor`;
    });
    [
        "claws",
        "eyes",
        "ichor",
        "light",
        "bone",
    ].forEach(h=>{
        setTimeout(()=>{
            Vhoff.addHumorCommerce(h);
        });
    });
}

Vhoff.loadDialogueActors = ()=>{
    env.dialogueActors.actual_vhoff_error = { 
        name: 'VHOFFFIEND',
        noProcess: true,
        image: Ochem.modLoc+'/img/vhofffiend.gif',
        type: "vhofffiend portrait-dark portrait-contain",
        voice: ()=>{play('talkrot', 3)}
    }
};

// Vhoff.loadCallbacks = {
//     env: [Vhoff.loadDialogueActors],
//     frame: [Vhoff.proxyObjects, Vhoff.modifyCommerce],
//     ozo: [],
//     credits: [],
// };


Vhoff.isFrame = document.URL.includes('/local/beneath/embassy/');
Vhoff.isOzo = document.URL.includes('/local/ozo/');
Vhoff.isCredits = document.URL.includes('credits');

//TODO: make this better

Vhoff.onLoadEnv = function(...callbacks){
    let thisIntervalID = setInterval(()=>{
        if (window?.env){
            callbacks.forEach(callback=>{
                try {
                    callback();
                } catch (e) {
                    Vhoff.errorReadout(`Caught error in env loader callback: ${e}`);
                }
            });
            clearInterval(thisIntervalID);
        }
    }, 100);
}

Vhoff.onLoadEnv(Vhoff.loadDialogueActors);

Vhoff.onLoadFrame = function(...callbacks){
    if (!Vhoff.isFrame){ return; }
    let thisIntervalID = setInterval(()=>{
        if (window?.env?.e3a2 && page.party){
            callbacks.forEach(callback=>{
                try {
                    callback();
                } catch (e) {
                    Vhoff.errorReadout(`Caught error in frame loader callback: ${e}`);
                }
            });
            clearInterval(thisIntervalID);
        }
    }, 100);
}

Vhoff.onLoadFrame(Vhoff.proxyObjects, Vhoff.modifyCommerce)

Vhoff.onLoadFrame(()=>{
    Vhoff.registerCombatFormation('target_dummy', {
        name: "TARGET DUMMY",
        help: "'testing grounds';'passive thoughtforms'",
        enemies: ["target_dummy", "target_dummy", "target_dummy", "target_dummy", "target_dummy"],
        advanceRate: 1000,
    });

    Vhoff.registerCombatActor('target_dummy', {
        name: "Target Dummy",
        maxhp: 999,
        hp: 999,
        actions: ["nothing"],
        graphic: env.COMBAT_ACTORS.critta_pawn.graphic,
        reactions: {},
        initialStatusEffects: [["invincible", 1]],
    });
});



Vhoff.onLoadOzo = function(...callbacks){
    if (!Vhoff.isOzo){ return; }
    let thisIntervalID = setInterval(()=>{
        if (window?.env?.dialogues){
            callbacks.forEach(callback=>{
                try {
                    callback();
                } catch (e) {
                    Vhoff.errorReadout(`Caught error in ozo loader callback: ${e}`);
                }
            });
            clearInterval(thisIntervalID);
        }
    }, 100);
}

Vhoff.onLoadCredits = function(...callbacks){
    if (!Vhoff.isCredits){ return; }
    let thisIntervalID = setInterval(()=>{
        if (document.getElementsByClassName('fundfriends').length){
            callbacks.forEach(callback=>{
                try {
                    callback();
                } catch (e) {
                    Vhoff.errorReadout(`Caught error in credits loader callback: ${e}`);
                }
            });
            clearInterval(thisIntervalID);
        }
    }, 100);
}

Vhoff.ANIMATIONS = {
    classIn: function(user, addClass){
        let animElement = user.sprite || user.box;
        animElement.classList.add(addClass);
    },
    classOut: function(user, removeClass){
        let animElement = user.sprite || user.box;
        animElement.classList.remove(removeClass);
    },
    classAnim: function(user, animClass, time){
        Vhoff.ANIMATIONS.classIn(user, animClass);
        setTimeout(()=>Vhoff.ANIMATIONS.classOut(user, animClass), time);
    },
    scramble: function(user, rate=1){
        Vhoff.ANIMATIONS.classAnim(user, 'scramble', 100*rate);
    },
    destabilize: function(user, rate=1){
        if(env.rpg.classList.contains("bastard")) {                
            if(user.team.name == "ally") {
                env.rpg.classList.add('incoherentbg')
                content.classList.add('painprep', 'painfade', 'painhalf')
                setTimeout(()=>{content.classList.add('painmode')}, 100*rate)
                setTimeout(()=>{content.classList.remove('painmode')}, 4000*rate)
                setTimeout(()=>{content.classList.remove('painprep', 'painfade', 'painhalf')}, 5000*rate)

                setTimeout(()=>{env.rpg.classList.remove('incoherentbg')}, 4000*rate)
            }
        } else {
            ratween(env.bgm, 1, 2000)
            env.rpg.classList.add('incoherentbg')
            content.classList.add('painprep', 'painhalf')
            setTimeout(()=>{content.classList.add('painmode')}, 100*rate)
            setTimeout(()=>{content.classList.remove('painmode')}, 4000*rate)
            setTimeout(()=>{content.classList.remove('painprep', 'painhalf')}, 5000*rate)
        }
    },
    broadcast: function(rate=1){
        content.classList.add('painprep', 'painhalf')
		setTimeout(()=>{content.classList.add('painmode')}, 100*rate)
		setTimeout(()=>{content.classList.remove('painmode')}, 2000*rate)
		setTimeout(()=>{content.classList.remove('painprep', 'painhalf')}, 3000*rate)
        env.rpg.classList.remove('incoherentbg')
    }
}

Vhoff.ACTIONS = {
    multiHit: ({
        user,
        action,

        actorList,
        resample,
        replace = true,

        anim, //needs to take a Vhoff combat anim
        animWaitScale = 1,
        exec,
        
        exactDelay,
        extraDelay,

        finale,
        finaleDelay = 0,

        advanceDelay,
        endCallback,
        advanceAfterExec,
        beingUsedAsync
    }) => {
        let effectiveList = [...actorList];

        if (resample){
            let resampleList = [];
            if (replace){
                for (let i = 0; i < resample; i++) {
                    resampleList.push(effectiveList.sample());
                }
            } else if (resample < effectiveList.length){
                for (let i = 0; i < resample; i++) {
                    resampleList.push(effectiveList.sample({remove: true}));
                }
            } else {
                resampleList.push(...effectiveList);
            }

            effectiveList = resampleList;
        }

        let delay;
        if (exactDelay !== undefined){
            delay = exactDelay;
        } else {
            delay = env.ADVANCE_RATE * 0.2;
            if (extraDelay){
                delay += extraDelay;
            }
        }

        effectiveList.forEach(function(actor, i) {
            if(actor.state != "dead" && actor.state != "lastStand") {
                if (anim){
                    setTimeout(()=>anim.exec(action, user, actor, ()=>{exec(actor, i)}, animWaitScale), delay*i);
                } else {
                    setTimeout(()=>exec(actor, i), delay*i);
                }
                
            }
        });

        advanceDelay ??= env.ADVANCE_RATE * 0.5;

        if (finale){
            setTimeout(()=>{finale()}, (delay * effectiveList.length) + finaleDelay);
        }

        setTimeout(()=>{
            if(advanceAfterExec && !beingUsedAsync){
                Vhoff.log("ADVANCE - multiHit")
                advanceTurn(user)
                if(typeof endCallback == "function") endCallback()
            }
        }, (delay * effectiveList.length) + finaleDelay + advanceDelay);
    },
    //TODO: i feel like this is so common that we need to shorten this somewhat. idk... -ARRHY
    inflictStatus: (target, origin, statObj, alts)=>{
        let callObj = {
            target,
            origin,
            status: statObj.name,
            length: statObj.length ?? 1,
            noReact: statObj.noReact,
        }
        if (alts){
            Object.assign(callObj, alts);
        }
        return addStatus(callObj);
    }
    // inflictStatusPool: (target, origin, statPools, alts)
}

Vhoff.COMBAT_ANIMS = {
    shoot: { //a symbol appears on sprite, spins, then resolves
        duration: 400,
        type: "sprite",
        exec: function(action, origin, target, thenExec, durationScale){

            // console.log(this);
            
            //animations are done on the box if no sprite
            let zone = target.sprite || target.box
            
            play('click1')
            zone.insertAdjacentHTML('beforeend', `<div class="special-anim-shoot ${target.slug}-shot"></div>`)
            env.rpg.querySelectorAll(`#ally-team .actor#${target.slug}, #enemy-graphic #${target.slug}-sprite-wrapper`).forEach(el=>el.insertAdjacentHTML('beforeend', `<div class="special-anim-shoot ${target.slug}-shot"></div>`))

            //conclude by running thenExec

            if (thenExec){
                durationScale ??= 1;
                setTimeout(thenExec, this.duration*durationScale);
            }

            setTimeout(()=>{
                console.log('removing now')
                zone.querySelectorAll(`.special-anim-shoot.${target.slug}-shot`).forEach(el=> el.remove())
            }, this.duration * 2)
        }
    },
    
    flare: { //a symbol appears on sprite, spins, then resolves
        duration: 250,
        type: "sprite",
        exec: function(action, origin, target, thenExec, durationScale){

            // console.log(this);
            
            //animations are done on the box if no sprite
            let zone = target.sprite || target.box

            zone.insertAdjacentHTML('beforeend', `<div class="special-anim-flare ${target.slug}-shot"></div>`)
            env.rpg.querySelectorAll(`#ally-team .actor#${target.slug}, #enemy-graphic #${target.slug}-sprite-wrapper`).forEach(el=>el.insertAdjacentHTML('beforeend', `<div class="special-anim-flare ${target.slug}-shot"></div>`))

            if (thenExec){
                durationScale ??= 1;
                setTimeout(thenExec, this.duration*durationScale);
            }

            //conclude by running action exec
            setTimeout(()=>{
                //console.log('removing now')
                zone.querySelectorAll(`.special-anim-flare.${target.slug}-shot`).forEach(el=> el.remove())
            },  this.duration * 2)
        }
    },
};

Vhoff.makeChancePanel = function({forSlug, displayLabels, wheelLabels, resultString="???", panelBaseURL="/img/sprites/flantrusive/panelbase.gif"}){

    if (!displayLabels?.length){
        Vhoff.error('Unknown result labels for chance panel!');
        return;
    }

    if (wheelLabels && !wheelLabels.length){
        Vhoff.error('Unknown wheel labels for chance panel!');
        return;
    }

    if (!wheelLabels){
        wheelLabels = displayLabels.map((v,i)=>`${i+1}`);
    }

    displayLabels = displayLabels.slice(0, wheelLabels.length);
    wheelLabels = wheelLabels.slice(0, displayLabels.length);

    let chancePanel = document.createElement('figure');
    chancePanel.setAttribute('id', 'chancepanel')
    chancePanel.classList.add('hidden');
    chancePanel.setAttribute('for', forSlug);

    let panelbase = document.createElement('img');
    panelbase.setAttribute('src', panelBaseURL);

    chancePanel.appendChild(panelbase);

    let wheel = document.createElement('div');
    let wheelul = document.createElement('ul');

    wheelLabels.forEach((l,i)=>{
        let li = document.createElement('li');
        li.classList.add(`d${i+1}`);
        li.innerText = l;

        wheelul.appendChild(li);
    })

    wheel.classList.add('wheel');

    chancePanel.appendChild(wheel);
    wheel.appendChild(wheelul);

    let display = document.createElement('div');
    let displayol = document.createElement('ol');

    display.classList.add('display');

    displayLabels.forEach((l,i)=>{
        let li = document.createElement('li');
        li.classList.add(`d${i+1}`);
        li.innerText = l;

        displayol.appendChild(li);
    })

    chancePanel.appendChild(display);
    display.appendChild(displayol);

    let result = document.createElement('div');
    let resultdiv = document.createElement('div');
    let resultdivspan = document.createElement('span');

    result.classList.add('result');

    chancePanel.appendChild(result);
    result.appendChild(resultdiv);
    resultdiv.appendChild(resultdivspan);

    chancePanel.result = resultdivspan;
    chancePanel.spin = (state)=>{
        chancePanel.removeAttribute("chosen");
        chancePanel.classList.toggle("spinning", state);
        resultdivspan.innerHTML = resultString;
    }

    chancepanel.stopAndResult = () => { 
        let result = rand(1, displayLabels.length+1);
        chancepanel.spin(false);
        chancepanel.setAttribute("chosen", result);

        return result;
    }

    return chancePanel;
}


Vhoff.enterDummyFight = function({sideLock, side, difficulty, formation, component, tension, modifier, dummyCount} = {}) {
    dummyCount ??= 5;
    formation = JSON.parse(JSON.stringify(env.COMBAT_FORMATIONS.target_dummy));
    formation.enemies = [];
    for (let i = 0; i < dummyCount; i++) {
        formation.enemies.push('target_dummy');
    }
    Vhoff.enterFight({sideLock, side, difficulty, formation, component, tension, modifier});
}

Vhoff.makeDevPanel = function(){
    let panel = document.createElement('div');
    panel.classList.add('vhoff-devpanel');

    let actorsSection = document.createElement('div');
    actorsSection.classList.add('debug-section-actors');

    let enemyTeam = document.createElement('div');
    enemyTeam.classList.add('debug-team');
    enemyTeam.classList.add('debug-team-enemy');
    actorsSection.appendChild(enemyTeam);

    let allyTeam = document.createElement('div');
    allyTeam.classList.add('debug-team');
    allyTeam.classList.add('debug-team-ally');
    actorsSection.appendChild(allyTeam);

    panel.appendChild(actorsSection);

    let info = document.createElement("div");
    info.classList.add("debug-info-view");
    panel.appendChild(info);

    let searchContainer = document.createElement("div");

    let filterOptions = {
        type: "group",
        options: [
            {
                type: "radio",
                options: [
                    {
                        display: "name",
                        internal: "name",
                        default: true
                    },
                    {
                        display: "slug",
                        internal: "id",
                    }
                ]
            },
            {
                type: "atLeastOne",
                options: [
                    {
                        display: "actor",
                        internal: "actor",
                        default: true
                    },
                    {
                        display: "status effect",
                        internal: "statusEffect",
                        default: true
                    },
                    {
                        display: "actions",
                        internal: "action",
                        default: true
                    }
                ]
            },
            {
                type: "radio",
                options: [
                    {
                        display: "normal",
                        internal: "normal",
                        default: true
                    },
                    {
                        display: "regex",
                        internal: "regex",
                    }
                ]
            },
        ]
    };

    const groupFns = {
        childAt(i) {
            return this.childNodes.item(i);
        }
    }
    const atLeastOneFns = {
        selectChoice(name) {
            this.selected.add(name);
            this.choices[name].classList.add("debug-option-alo-choice-selected");
        },
        unselectChoice(name) {
            if (this.selected.size > 1) {
                this.selected.delete(name);
                this.choices[name].classList.remove("debug-option-alo-choice-selected");
            }
        },
        toggleChoice(name) {
            if (this.selected.has(name)) {
                this.unselectChoice(name);
            }
            else {
                this.selectChoice(name);
            }
        }
    };
    const radioFns = {
        selectChoice(name) {
            this.selected = name;
            for (const prop in this.choices) {
                if (name === prop) {
                    this.choices[prop].classList.add("debug-option-radio-choice-selected");
                }
                else {
                    this.choices[prop].classList.remove("debug-option-radio-choice-selected");
                }
            }
        }
    };

    const generateFilters = (option) => {
        switch (option.type) {
            case "group": {
                const elem = document.createElement("div");
                for (const prop in groupFns) {
                    elem[prop] = groupFns[prop];
                }
                elem.classList.add("debug-option-group");
                // elem.
                const children = option.options.map(generateFilters);
                elem.replaceChildren(...children);
                return elem;
            }
            case "atLeastOne": {
                const elem = document.createElement("div");
                elem.classList.add("debug-option-alo");
                for (const prop in atLeastOneFns) {
                    elem[prop] = atLeastOneFns[prop];
                }
                const selected = new Set();
                elem.selected = selected;
                elem.choices = {};
                const children = option.options.map(opt => {
                    const child = document.createElement("div");
                    elem.choices[opt.internal] = child;
                    child.textContent = opt.display;
                    if (opt.default) {
                        elem.selectChoice(opt.internal);
                    }
                    child.classList.add("debug-option-alo-choice");
                    child.addEventListener("click", () => {
                        elem.toggleChoice(opt.internal);
                    });
                    return child;
                });
                elem.replaceChildren(...children);
                return elem;
            }
            case "radio": {
                const elem = document.createElement("div");
                elem.classList.add("debug-option-radio");
                for (const prop in radioFns) {
                    elem[prop] = radioFns[prop];
                }
                elem.selected = null;
                elem.choices = {};
                const children = option.options.map(opt => {
                    const child = document.createElement("div");
                    elem.choices[opt.internal] = child;
                    child.textContent = opt.display;
                    if (opt.default) {
                        elem.selectChoice(opt.internal);
                    }
                    child.classList.add("debug-option-radio-choice");
                    child.addEventListener("click", () => {
                        elem.selectChoice(opt.internal);
                    });
                    return child;
                });
                elem.replaceChildren(...children);
                return elem;
            }
        }
    }

    let filterSettings = generateFilters(filterOptions);
    filterSettings.classList.add("debug-search-filter-settings");
    searchContainer.appendChild(filterSettings);

    let searchBar = document.createElement("textarea");
    searchBar.classList.add("debug-search-bar");
    searchBar.setAttribute('placeholder', 'Frenzy');
    searchContainer.appendChild(searchBar);

    let searchResults = document.createElement("div");
    searchResults.classList.add('debug-search-results');
    searchContainer.appendChild(searchResults);

    panel.appendChild(searchContainer);

    let highlighted = null;

    let infoProperties = {
        "name": {
            get: (actor)=>actor.name,
        },
        "slug": {
            get: (actor)=>actor.slug,
        },
        "originalName": {
            get: (actor)=>actor.originalName,
        },
        "originalSlug": {
            get: (actor)=>actor.originalSlug,
        },
        "hp": {
            get: (actor)=>actor.hp,
            set: (actor,val)=>{actor.hp = val},
            setType: 'numeric',
        },
        "maxhp": {
            get: (actor)=>actor.maxhp,
            set: (actor,val)=>{actor.maxhp = val},
            setType: 'numeric',
        },
        "bp": {
            get: (actor)=>actor.bp,
            set: (actor,val)=>{actor.bp = val},
            setType: 'numeric',
        },
        "state": {
            get: (actor)=>actor.state,
            set: (actor,val)=>{actor.state = val},
            setType: 'string',
        },
        "status effects": {
            get: (actor)=>actor.statusEffects,
            sub: {
                "slug": {
                    get: (obj)=>obj.slug
                },
                "duration": {
                    get: (obj)=>obj.duration,
                    set: (obj,val)=>{obj.duration = val},
                    setType: 'numeric',
                },
            }
            // .map(s=>({
            //     slug: s.slug,
            //     duration: s.duration
            // })),
            // set: (actor,val)=>{actor.state = val},
            // setType: 'string',
        },
        "actions": {
            get: (actor)=>actor.actions.join(", "),
            set: (actor, val)=>{actor.actions = val.split(",").map(a=>a.trim());},
            setType: 'string'
        },
    };

    function makeInfoEntries(obj, properties){
        let children = [];
        let row = 1;
        for (const key in properties) {
            const prop = properties[key];

            const keySpan = document.createElement("span");
            keySpan.innerText = key;
            keySpan.classList.add("debug-info-item");
            keySpan.classList.add("debug-info-item-key");

            keySpan.style.setProperty('grid-row',`${row} / ${row+1}`);

            let valElem;

            if (!prop.set){
                if (!prop.sub){
                    valElem = document.createElement("span");    
                    valElem.innerText = prop.get(obj);
                } else {
                    valElem = document.createElement("div");
                    valElem.classList.add('debug-info-collapsible');
                    let l = prop.get(obj);
                    console.log(l);
                    l.forEach(entry=>{
                        let containerElem = document.createElement("div"); 
                        containerElem.replaceChildren(...makeInfoEntries(entry, prop.sub));
                        containerElem.classList.add('debug-info-view-sub');
                        valElem.appendChild(containerElem);
                    });
                }
            } else {
                if (prop.setType == 'numeric'){
                    valElem = document.createElement("input");
                    valElem.setAttribute('type','number');
                    valElem.setAttribute('min','0');
                    valElem.value = prop.get(obj);

                    valElem.addEventListener('change',(e)=>{
                        prop.set(obj, valElem.valueAsNumber);
                    });
                } else {
                    valElem = document.createElement("input");
                    valElem.setAttribute('type','text');
                    valElem.value = prop.get(obj);

                    valElem.addEventListener('change',(e)=>{
                        prop.set(obj, valElem.value);
                    });
                }
            }

            valElem.classList.add("debug-info-item");
            valElem.classList.add("debug-info-item-val");
            valElem.style.setProperty('grid-row',`${row} / ${row+1}`);

            // child.appendChild(keySpan);
            // child.appendChild(valSpan);

            // child.innerText = `${prop}: ${highlighted.battleActor[prop]}`;
            children.push(keySpan);
            children.push(valElem);
            row++;
        }
        return children;
    }

    info.refreshInfo = function() {
        if (highlighted?.battleActor) {
            info.replaceChildren(...makeInfoEntries(highlighted.battleActor, infoProperties));
        } else {
            info.replaceChildren();
        }
    }

    searchBar.refreshSearch = function() {
        let searchTerm = searchBar.value;
        
        let searchKey = filterSettings.childAt(0).selected; // or "id"
        let includeStatus = filterSettings.childAt(1).selected.has("statusEffect");
        let includeAction = filterSettings.childAt(1).selected.has("action");
        let includeActor = filterSettings.childAt(1).selected.has("actor");
        let searchType = filterSettings.childAt(2).selected;

        let searchItems = [];

        if (includeStatus){
            searchItems.push(...Object.entries(env.STATUS_EFFECTS).map(l=>l.concat('status')));
        }
        if (includeAction){
            searchItems.push(...Object.entries(env.ACTIONS).map(l=>l.concat('action')));
        }
        if (includeActor){
            searchItems.push(...Object.entries(env.COMBAT_ACTORS).map(l=>l.concat('actor')));
        }

        let matchreg;
        try {
            matchreg = new RegExp(searchTerm);
        } catch {
            //nothing?
        }

        let searchResultObjs = searchItems.map(([id, val, type])=>{
            switch (searchKey){
                case "name":
                    return [id, val.name, val, type];
                case "id":
                default:
                    return [id, id, val, type];
            }
        
        }).filter(([id, key, val, type])=>{
            switch (searchType){
                case "normal":
                    return searchTerm.toLowerCase().split(/(_|\s|\b)/).every(p=>key.toLowerCase().includes(p));
                case "regex":
                default:
                    return matchreg && key.match(matchreg);
            }
        });

        while (searchResults.firstChild){
            searchResults.removeChild(searchResults.lastChild);
        }
        
        searchResultObjs.sort((x,y)=>x[1].localeCompare(y[1]));

        let row = 0;
        searchResultObjs.forEach(([id, key, val, type])=>{
            
            let typeSpan = document.createElement('span');
            typeSpan.classList.add(`debug-result-${type}`);
            typeSpan.classList.add(`debug-result-span-type`);
            switch (type){
                case "actor":
                    typeSpan.innerText = 'E';
                    typeSpan.setAttribute('definition','actor');
                    break;
                case "action":
                    typeSpan.innerText = 'A';
                    typeSpan.setAttribute('definition','action');
                    break;
                case "status":
                    typeSpan.innerText = 'S';
                    typeSpan.setAttribute('definition','status');
                    break;
            }

            typeSpan.style.setProperty('grid-row',`${row} / ${row+1}`);

            searchResults.appendChild(typeSpan);
            
            let keySpan = document.createElement('span');
            keySpan.classList.add(`debug-result-${type}`);
            keySpan.classList.add(`debug-result-span-key`);
            keySpan.innerText = `${id}`;

            keySpan.style.setProperty('grid-row',`${row} / ${row+1}`);

            searchResults.appendChild(keySpan);
            
            let valSpan = document.createElement('span');
            valSpan.classList.add(`debug-result-${type}`);
            if (type == 'action' || type == 'status'){
                valSpan.classList.add(`debug-result-span-val`);
            } else {
                valSpan.classList.add(`debug-result-span-val-big`);
            }
            valSpan.innerText = `${val.name}`;

            valSpan.style.setProperty('grid-row',`${row} / ${row+1}`);
        
            searchResults.appendChild(valSpan);

            
            if (type == 'action' || type == 'status'){
                let defSpan = document.createElement('span');
                defSpan.classList.add(`debug-result-${type}`);
                defSpan.innerText = `D`;

                if (type=='action'){
                    defSpan.setAttribute('definition',`ACTION++${id}`);
                } else if (type=='status'){
                    defSpan.setAttribute('definition',`STATUS++${id}`);
                }

                defSpan.style.setProperty('grid-row',`${row} / ${row+1}`);
            
                searchResults.appendChild(defSpan);
            }
            

            

            row++;
        });

    }

    searchBar.addEventListener('keydown', searchBar.refreshSearch);
    searchBar.addEventListener('keyup', searchBar.refreshSearch);
    filterSettings.addEventListener('click', searchBar.refreshSearch);

    panel.createActorElem = (teamElem, actor)=>{
        // Vhoff.log(actor);
        let actorElement = document.createElement('div');
        actorElement.classList.add('debug-actor');
        actorElement.battleActor = actor;
        actorElement.addEventListener("click", () => {
            highlighted?.classList.remove("highlighted");
            highlighted = actorElement;
            highlighted.classList.add("highlighted");
            info.refreshInfo();
        });
        
        let actorName = document.createElement("span");
        actorName.classList.add("debug-actor-name");
        actorName.innerText = actor.name;
        actorElement.appendChild(actorName);

        let actorIcons = document.createElement("span");
        actorIcons.classList.add("debug-actor-icons");
        
        if (actor === env.rpg.currentActor) {
            let actorTurn = document.createElement("span");
            actorTurn.classList.add("debug-actor-turn-indicator");
            actorTurn.innerText = "←";
            actorIcons.appendChild(actorTurn);
        }

        let actorUpdate = document.createElement("button");
        actorUpdate.classList.add("debug-actor-update");
        actorUpdate.innerText = "↻";
        actorUpdate.addEventListener("click", () => {
            updateStats({actor});
        });
        actorIcons.appendChild(actorUpdate);

        let actorRemove = document.createElement("button");
        actorRemove.classList.add("debug-actor-remove");
        actorRemove.innerText = "×";
        actorRemove.addEventListener("click", () => {
            midCombatActorRemove(actor);
        });
        actorIcons.appendChild(actorRemove);

        actorElement.appendChild(actorIcons);

        teamElem.appendChild(actorElement);
    };

    panel.refreshActors = ()=>{
        [
            [enemyTeam, env.rpg.enemyTeam.members],
            [allyTeam, env.rpg.allyTeam.members],
        ].forEach(([elem, team])=>{
            while (elem.firstChild){
                elem.removeChild(elem.lastChild);
            }

            team.forEach(actor=>{
                panel.createActorElem(elem, actor);
            })
        });
        
    }

    panel.refreshAll = ()=>{
        panel.refreshActors();
        info.refreshInfo();
    }

    panel.refreshAll();

    return panel;
}

Vhoff.toggleDevPanel = function(){
    let devpanel = document.getElementById('vhoff-devpanel');
    if (!devpanel){
        devpanel = Vhoff.makeDevPanel();
        devpanel.setAttribute('id', 'vhoff-devpanel');
        content.appendChild(devpanel);
        return;
    }
    if (devpanel.classList.contains('hidden')){
        devpanel.classList.remove('hidden');
    } else {
        devpanel.classList.add('hidden');
    }
}

Vhoff.devPanelRefresh = function(){
    let devpanel = document.getElementById('vhoff-devpanel');
    if (!devpanel) return;
    devpanel.refreshAll();
}

Vhoff.enterFight = function({sideLock, side, difficulty, formation, component, tension, modifier}) {

    exitMenu()
    vn.hideStage(true, true)
    vn.fadeChars(true)
    if(env?.stage?.freemove && !env.rpg?.active) toggleMouseLook(false) //pause

    console.log("sidelock?", sideLock, side)
    if(sideLock && side != "center") {
        env.crittaMap.setAttribute("sidelock", side)
        console.log("locking")
    } else {
        env.crittaMap.removeAttribute("sidelock")
        console.log("unlocking")
    }

    chatter({actor: 'sourceless', text: `daemons spring forth from the ocean!`, readout: true})

    let classes = `${difficulty == "4" ? "" : "crittamode"}${formation.class ? ` ${formation.class}` : ""}`
    let effectiveEnemies = formation.enemies

    let bgm = formation.getBgm ? formation.getBgm() : difficulty >= 2 ? env.e3a2.preferredBgm.boss : env.e3a2.preferredBgm.combat

    //random!
    if(typeof bgm == "string") {
        let category = env.e3a2.tracks[bgm.split("-")[1]]
        let options = Object.entries(category).filter(t=>shouldItShow(t[1]))

        bgm = options.sample()[1]
        bgm.load()
        
        console.log("got random", category, options, bgm)
    }

    let bgmRate = formation.bgmRate ? formation.bgmRate : bgm.intendedRate ? bgm.intendedRate : 1
    let bgmStart = 0
    let bgmVol = env.bgm.volume()
    
    if(bgm._src.includes("daemon_midboss")) {
        switch(difficulty) {
            case 2: bgmRate = 0.75; break
            case 3: bgmRate = 0.85; break
            case 4: bgmRate = 1; break
        }
    }

    if(bgm.randomRates) bgmRate = bgm.randomRates.sample()
    if(bgm.randomStarts) bgmStart = bgm.randomStarts.sample()


    function getModifiers() {
        let modifiers = []
        if(modifier) modifiers.push(modifier);
        modifiers = modifiers.concat(env.crittaMap.getModArray())

        return modifiers
    }

    function getAlterations() {
        var endAlterations = {}
        let modifiers = getModifiers()

        if(modifiers.length) {
            for (const modifier of modifiers) {
                if(modifier.alterations) for(const teamName in modifier.alterations) {
                    if(!endAlterations[teamName]) endAlterations[teamName] = [].concat(modifier.alterations[teamName])
                    else endAlterations[teamName] = endAlterations[teamName].concat(modifier.alterations[teamName])
                }                    
            }
        }

        return endAlterations
    }

    function finish(){
        body.classList.remove('cull-stage', 'in-grid-combat', 'in-combat', 'nomenus')
        content.classList.add('show-vn')
        console.log("in shutdown")
        env.rpg.active = false
        env.rpg.classList.add('over')
        if(env.rpg.settings.bgm) revertBgm(hardClose ? 0 : 1000)
        env.rpg.remove()
        env.rpg = false
    }

    bgm.intendedRate = bgmRate
    let settings = {
        effectiveEnemies, // we pass the formation this way because we want to allow global modifiers to poke it
        party: page.party,
        bgm,
        bgmRate,
        bgmStart,
        bgmVol,
        teamAlterations: getAlterations(),
        combatClass: classes,
        manualStop: true,
        manualStopCallback: finish,
        endCallback: finish,
        actorPreprocess: (actor) => CrittaNode.daemonSpawn(actor, "preprocess"),
        actorSpriteProcess: (actor) => CrittaNode.daemonSpawn(actor, "sprite"),
        startCallback: ()=> {
            if(component) env.rpg.setAttribute('component', component.slug);
            if(modifier) env.rpg.insertAdjacentHTML('beforeend', `<div component="${component.slug}" definition="EFFECT::${modifier.getHelp().toUpperCase()}" class="modifier">${modifier.name}</div>`);
            env.rpg.setAttribute('tension', tension);
        }
    }

    for (const modifier of env.crittaMap.getModArray()) {
        if(modifier.beforeCombat) modifier.beforeCombat(settings)
    }

    let finalEnemies = []
    settings.effectiveEnemies.forEach(enemySlug => {
        let group = env.COMBAT_GROUPS[weightRand(CrittaMap.TENSIONWEIGHT[env.crittaMap.tension])]
        if(group[enemySlug]) { // if their slug is in here, use that instead cause they're generic/replace-intended
            let selection = group[enemySlug].sample()
            switch(typeof group[enemySlug]) {
                case "object": // (array)
                    finalEnemies = finalEnemies.concat(selection)
                break

                default: finalEnemies.push(selection)
            }
        } else { // otherwise trust that the enemy exists
            finalEnemies.push(enemySlug)
        }
    })
    settings.effectiveEnemies = finalEnemies
    

    try{
        startCombat(settings.effectiveEnemies, settings.party, settings)
    } catch(e) { printError(e) }
}
