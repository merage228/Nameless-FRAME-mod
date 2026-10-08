// MOD :: UNSTABLE STORM
// BY : MERAGE (and dont forget the creators of HH and Ochem!)

// VERSION NUMBER :: 0.0.0
/*
CHANGELOG ::
      - nothing yet

*/

window.Ust ??= {};

try {
    let modtextElement = document.getElementById('modtext');

    if (!modtextElement && window?.env?.menuStorage?.elements){
        modtextElement = env.menuStorage.elements["system-menu"].getElementsByTagName('textarea')[0];
    }
    
    let modsString = modtextElement?.value || JSON.parse(localStorage.getItem('flags')).modList;

    console.log(modtextElement, modtextElement?.value, window.mods, modsString);

    if (modsString){
        for (mod of modsString.split('\n')){
            if (mod.startsWith("https://github.com/merage228/Nameless-FRAME-mod")){
                Ust.modLoc = mod.slice(0,-7);
                break;
            }
        }

        if (!Ust.modLoc){
            for (mod of modsString.split('\n')){
                if (mod.startsWith("http://127.0.0.1")){
                    Ust.modLoc = mod.slice(0,-7);
                    break;
                }
            }
        }
    } else {
        Ust.modLoc = "https://github.com/merage228/Nameless-FRAME-mod/raw/branch/main/";
    }
} catch (e) {
    console.error(`Caught error on mainload: ${e}`)
    Ust.modLoc = "https://github.com/merage228/Nameless-FRAME-mod";
}

function entered(){
    console.log('LOADING UNSTABLE STORM...');
    addResources([
        `${Ust.modLoc}/framesave.js`,
        `${Ust.modLoc}/vhoff.js`,
    	`${Ust.modLoc}/Ust.js`
    ]);
    if (!Ust.modLoc.includes('branch/latest') && !Ust.modLoc.includes('127')){
        setTimeout(()=>{
            chatter({actor: 'actual_site_error', readout:true, text: 'Warning! Only the /latest/ branch of Unstable storm is meant to be stable.'});
            chatter({actor: 'actual_site_error', readout:true, text: 'If you care about everything not exploding to pieces, consider modifying the mod URL to:'});
            chatter({actor: 'actual_site_error', readout:true, text: '<a style="color: white;" href="https://github.com/merage228/Nameless-FRAME-mod/raw/branch/latest/main.js">https://git.encodeco.de/circadianarrhythmia/organic-chemistry/raw/branch/latest/main.js</a>'});
            chatter({actor: 'actual_site_error', readout:true, text: "Otherwise... there is no getting off Mr. Bones' Wild Ride. Enjoy the fireworks!"});
        }, 1000)
    }
}

if (document.URL.includes('credits')){
    setTimeout(entered, 1000);
} else {
    document.addEventListener('corru_entered', entered);
}
