// Preserve controls, focused inputs and running carousels while applying module order.
export function preserveHomeModules(current,incoming){
 const modules=new Map([...current.children].filter(node=>node.hasAttribute('data-home-module')).map(node=>[node.dataset.homeModule,node]));
 [...incoming.children].filter(node=>node.hasAttribute('data-home-module')).forEach(next=>{
  const previous=modules.get(next.dataset.homeModule);
  if(previous&&!previous.hasAttribute('data-history-pending')&&previous.dataset.homeSignature===next.dataset.homeSignature)next.replaceWith(previous);
 });
}
export function withPreviewWidgets(draft,live){
 return {...live,content:{...draft,transactions:{...draft.transactions,items:live.content.transactions?.items||[]}}};
}
