export default {
  async main({ libsearch }) {
    return `<div>
        <h2 class="visually-hidden">Search boxes – search Te Waharoa, the Library website, or Google Scholar</h2>
    <div class="search-boxes">
        <div id="te-waharoa-tab-box" class="lib-search-panel" role="tabpanel">
            <!--<label class="search-heading">Search Te Waharoa<span> – the Library’s discovery system</span></label>-->
            <form id="te-waharoa-search-form" action="">
                <label for="te-waharoa-search-field" class="search-heading" style="color: red;">Here is the library Search Te Waharoa – the Library’s discovery system</label>
                <div class="form-search">
                    <input id="te-waharoa-search-field" class="search-input" name="twq" autocomplete="off" type="text" value="" placeholder="Find books, articles, online resources…">
                    <button type="submit" class="no-icon button large primary">Search</button>
                </div>
            </form>
            <div class="sub-search-links">
                <a class="button flat" href="https://tewaharoa.victoria.ac.nz/discovery/search?vid=64VUW_INST:VUWNUI&mode=advanced&sortby=rank&lang=en"><i class="icon-external"></i>advanced search</a>
            </div>
        </div>
        <div id="library-website-tab-box" class="lib-search-panel hidden" role="tabpanel">
            <form id="library-search-form" action="./?a=1782126">
                <label for="search-keyword" class="search-heading">Search the Library website</label>
                <div class="big-search-form field-container">
                    <div class="form-search">
                        <input id="search-keyword" class="search-input" name="query" autocomplete="off" type="text" value="" placeholder="Find information about the Library">
                        <button type="submit" class="no-icon button large primary">Search</button>
                    </div>
                </div>
            </form>
        </div>
        <div id="google-scholar-tab-box" class="lib-search-panel hidden" role="tabpanel">
            
            <form id="google-scholar-search-form" action="https://scholar.google.com/scholar" >
                <label for="Google-Scholar-search-field" class="search-heading">Search Google Scholar</label>
                <div class="big-search-form field-container">
                    <div class="form-search">
                        <input id="Google-Scholar-search-field" class="search-input" name="q" autocomplete="off" type="text" value="" placeholder="Search Google Scholar">
                        <input type="hidden" name="inst" value="13048756322741660347" />
                        <button type="submit" class="no-icon button large primary">Search</button>
                    </div>
                </div>
            </form>
            <div class="sub-search-links">
                <a class="button flat" href="./?a=1783395">tips for using Google Scholar<i class="icon-arrow-right"></i></a>
            </div>
        </div>
    </div> <!-- /#search-boxes -->
    <div class="search-tabs" role="tablist" aria-label="Select search box">
        <ul role="none">
            <li><button id="te-waharoa-tab" class="search-tab no-icon" role="tab" aria-controls="te-waharoa-tab-box" aria-selected="true">Te Waharoa</button></li>
            <li><button id="library-website-tab" class="search-tab no-icon" role="tab" aria-controls="library-website-tab-box" aria-selected="false">Library website</button></li>
            <li><button id="google-scholar-tab" class="search-tab no-icon" role="tab" aria-controls="google-scholar-tab-box" aria-selected="false">Google Scholar</button></li>
        </ul>
    </div>
</div>
        </div>`;
  }
};
