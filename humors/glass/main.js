Vhoff.registerLoader("humor:glass", ()=>{

	Vhoff.addHumorCommerce('glass');
	if (!Ust.loadedHumors.includes('glass')){ Ust.loadedHumors.push('glass'); }
	Ust.log('ran GLASS humor loader');

},[]);


// Vhoff.load("humor:glass");

Ust.log('loaded GLASS humor file');
