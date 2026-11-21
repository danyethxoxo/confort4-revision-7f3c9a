export function deploymentOrigin(config){
 const value=process.env.CONFORT4_SITE_ORIGIN||config?.origin;
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||!url.hostname.includes('.'))throw Error('Invalid public HTTPS site origin');
 if(url.hostname!=='danyethxoxo.github.io'&&url.pathname!=='/')throw Error('Custom domains must publish at the domain root');
 return url.href.endsWith('/')?url.href:url.href+'/';
}
