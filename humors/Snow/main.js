Vhoff.registerLoader("humor:snow", ()=>{

	Vhoff.addHumorCommerce('snow');
	if (!Ust.loadedHumors.includes('snow')){ Ust.loadedHumors.push('snow'); }
	Ust.log('ran SNOW humor loader');

},[]);


// Vhoff.load("humor:snow");

Ust.log('loaded SNOW humor file');
