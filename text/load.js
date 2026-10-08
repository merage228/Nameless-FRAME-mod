Vhoff.localeText ??= {};

Vhoff.localeMakeActionEffects = function (lines){
	let out = "";
	lines.forEach(l=>{
		let idx = l.indexOf("::");
		if (idx > 0){
			let before = l.slice(0,idx+2);
			let after = l.slice(idx+2);
			if (before == 'SPECIAL::'){
				l = `<span style="color: var(--friend-color);">${before}</span>${after}`;
			} else {
				l = `<span style="color: var(--neutral-color);">${before}</span>${after}`;
			}
		}
		l = l.replaceAll(`{{AUTO}}`,`<span class="friend-shadow" style="color: var(--bright-color);">AUTO</span>`);
		out += l;
		out += "\n";
	});
	return out.trim();
}

Vhoff.localeEscapeQuotes = function (lines){
	console.log('making effects', lines);
	let out = "";
	lines.forEach(l=>{
		l = l.replaceAll(`"`,`&quot`);
		out += l;
		out += "\n";
	});
	return out.trim();
}


Vhoff.localeHighlightRules = [
	{
		check: (l=>(l[0].startsWith('action') && l[1] == 'events')),
		process: Vhoff.localeMakeActionEffects
	},
	{
		check: (l=>(l[0].startsWith('augment') && l[1] == 'description')),
		process: Vhoff.localeEscapeQuotes
	}
]

function parseLocaleText(text){
	let parts = text.split('\n').filter(l=>l).map(l=>{
		let indent = 0;
		while (l.startsWith('\t')){
			l = l.slice(1);
			indent++;
		}
		return [indent, l];
	}).reduce((arr,n)=>{
		if (!arr.length || arr[arr.length-1][0] != n[0]){
			return arr.concat([[n[0], [n[1]]]])
		} else {
			return arr.slice(0,-1).concat([[n[0], arr[arr.length-1][1].concat([n[1]])]])
		}
	},[])

	let loc = [];
	
	parts.forEach(([indent, l]) => {
		//TODO: maybe redo how this works -ARRHY
		if (loc.length < indent){
			Vhoff.error('Unexpected indent found!');
			return;
		}
		if (l.length == 1 && (indent == 0 || l[0].trimLeft().startsWith('.'))){
			if (loc.length > indent){
				loc = loc.slice(0,indent);
			}	
			if (indent == 0){
				loc.push(l[0].trim());
			} else {
				loc.push(l[0].trim().slice(1));
			}
		} else {
			let curr = Vhoff.localeText;
			loc.slice(0,-1).forEach(p=>{
				curr[p] ??= {};
				curr = curr[p];
			});
			for (let i = 0; i < Vhoff.localeHighlightRules.length; i++) {
				const rule = Vhoff.localeHighlightRules[i];
				if (rule.check(loc)){
					curr[loc[loc.length-1]] = rule.process(l);
					return;
				}
			}
			curr[loc[loc.length-1]] = l.join('\n');
			return;
		}
	});

	console.log(Vhoff.localeText);
}

Vhoff.RAWLOCALETEXTS ??= {};

// fetch(Ust.modLoc+`/text/locales/${locale}.txt`, {credentials:'omit'})
// 	.then(response => response.text())
// 	.then(parseLocaleText);
Vhoff.loadLocale = (locale)=>{
	let fallbackLocale = 'en-us';

	//TODO: detect locale here

	let supportedLocales = ['en-us'];

	if (!supportedLocales.includes(locale)){
		locale = fallbackLocale;
	}

	parseLocaleText(Vhoff.RAWLOCALETEXTS[locale])
	Vhoff.log('finished parsing locale', locale);
}

Ust.log('loaded text loader file');
