Vhoff.registerLoader("humor:rust", ()=>{

	Vhoff.addHumorCommerce('rust');
	if (!Ust.loadedHumors.includes('rust')){ Ust.loadedHumors.push('rust'); }
	Ust.log('ran rust humor loader');

},[]);


// Vhoff.load("humor:rust");

Ust.log('loaded rust humor file');
