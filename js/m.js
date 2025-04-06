~function(w){
    w.j=jQuery.noConflict();
    w.folder = location.pathname.split("/").slice(1)

    w.param = (new URL(w.location)).searchParams
    
    

}(window)
