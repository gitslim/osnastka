
/**
 * @file
 * icons.js
 * @author Bob Hutchinson http://drupal.org/user/52366
 * @copyright GNU GPL
 *
 * Icon manager for getlocations.
 * Required for markers to operate properly.
 * For Google maps API v3
 *
 * Derived from gmap icons.js
 */

/**
 * Get the Icon corresponding to a setname / sequence.
 * There is only one Icon for each slot in the sequence.
 * The marker set wraps around when reaching the end of the sequence.
 */

(function ($) {

  Drupal.getlocations = {};

  Drupal.getlocations.getIcon = function (setname, sequence) {

    if (!setname) {
      return;
    }

    if (!this.gicons) {
      this.gicons = {};
    }

    // If no sequence, synthesise one.
    if (!sequence) {
      // @TODO make this per-map.
      if (!this.sequences) {
        this.sequences = {};
      }
      if (!this.sequences[setname]) {
        this.sequences[setname] = -1;
      }
      this.sequences[setname]++;
      sequence = this.sequences[setname];
    }

    if (!this.gicons[setname]) {
      if (!Drupal.getlocations.icons[setname]) {
        var aa = {'!b': setname};
        alert(Drupal.t('Request for invalid marker set !b', aa));
      }
      this.gicons[setname] = [];
      var q = Drupal.getlocations.icons[setname];
      var p;
      var t = [];
      for (var i = 0; i < q.sequence.length; i++) {
        p = Drupal.getlocations.iconpath + q.path;

        t.image =  new google.maps.MarkerImage(
          p + q.sequence[i].f,
          new google.maps.Size(q.sequence[i].w, q.sequence[i].h),
          new google.maps.Point(q.imagepoint1X, q.imagepoint1Y),
          new google.maps.Point(q.imagepoint2X, q.imagepoint2Y)
        );
        if (q.shadow.f !== '') {
          t.shadow = new google.maps.MarkerImage(
            p + q.shadow.f,
            new google.maps.Size(q.shadow.w, q.shadow.h),
            new google.maps.Point(q.shadowpoint1X, q.shadowpoint1Y),
            new google.maps.Point(q.shadowpoint2X, q.shadowpoint2Y)
          );
        }
        // turn string in shapecoords into array
        if (q.shapecoords !== '') {
          t.shape = { coord: q.shapecoords.split(','), type: q.shapetype };
        }

        // @@@ imageMap?
        this.gicons[setname][i] = t;
      }
      delete Drupal.getlocations.icons[setname];
    }
    // TODO: Random, other cycle methods.
    return this.gicons[setname][sequence % this.gicons[setname].length];

  };

  /**
   * JSON callback to set up the icon defs.
   * When doing the JSON call, the data comes back in a packed format.
   * We need to expand it and file it away in a more useful format.
   */
  Drupal.getlocations.iconSetup = function () {
    Drupal.getlocations.icons = {};
    var m = Drupal.getlocations.icondata;
    var filef, filew, fileh, files;
    for (var path in m) {
      if (m.hasOwnProperty(path)) {
        // Reconstitute files array
        filef = m[path].f;
        filew = Drupal.getlocations.expandArray(m[path].w, filef.length);
        fileh = Drupal.getlocations.expandArray(m[path].h, filef.length);
        files = [];
        for (var i = 0; i < filef.length; i++) {
          files[i] = {f : filef[i], w : filew[i], h : fileh[i]};
        }

        for (var ini in m[path].i) {
          if (m[path].i.hasOwnProperty(ini)) {
            $.extend(Drupal.getlocations.icons, Drupal.getlocations.expandIconDef(m[path].i[ini], path, files));
          }
        }
      }
    }
  };

  /**
   * Expand a compressed array.
   * This will pad arr up to len using the last value of the old array.
   */
  Drupal.getlocations.expandArray = function (arr, len) {
    var d = arr[0];
    for (var i = 0; i < len; i++) {
      if (!arr[i]) {
        arr[i] = d;
      }
      else {
        d = arr[i];
      }
    }
    return arr;
  };

  /**
   * Expand icon definition.
   * This helper function is the reverse of the packer function found in
   * getlocations_markerinfo.inc.
   */
  Drupal.getlocations.expandIconDef = function (c, path, files) {

    var decomp = ['key', 'name', 'sequence',
      'imagepoint1X', 'imagepoint1Y', 'imagepoint2X', 'imagepoint2Y',
      'shadow', 'shadowpoint1X', 'shadowpoint1Y', 'shadowpoint2X', 'shadowpoint2Y',
      'shapecoords', 'shapetype'];

    var fallback = ['', '', [], 0, 0, 0, 0, {f: '', h: 0, w: 0}, 0, 0, 0, 0, '', ''];

    var imagerep = ['shadow'];

    var defaults = {};
    var sets = [];
    var i, j;
    // Part 1: Defaults / Markersets
    // Expand arrays and fill in missing ones with fallbacks
    for (i = 0; i < decomp.length; i++) {
      if (!c[0][i]) {
        c[0][i] = [ fallback[i] ];
      }
      c[0][i] = Drupal.getlocations.expandArray(c[0][i], c[0][0].length);
    }
    for (i = 0; i < c[0][0].length; i++) {
      for (j = 0; j < decomp.length; j++) {
        if (i === 0) {
          defaults[decomp[j]] = c[0][j][i];
        }
        else {
          if (!sets[i - 1]) {
            sets[i - 1] = {};
          }
          sets[i - 1][decomp[j]] = c[0][j][i];
        }
      }
    }
    for (i = 0; i < sets.length; i++) {
      for (j = 0; j < decomp.length; j++) {
        if (sets[i][decomp[j]] === fallback[j]) {
          sets[i][decomp[j]] = defaults[decomp[j]];
        }
      }
    }
    var icons = {};
    for (i = 0; i < sets.length; i++) {
      var key = sets[i].key;
      icons[key] = sets[i];
      icons[key].path = path;
      delete icons[key].key;
      delete sets[i];
      for (j = 0; j < icons[key].sequence.length; j++) {
        icons[key].sequence[j] = files[icons[key].sequence[j]];
      }
      for (j = 0; j < imagerep.length; j++) {
        if (typeof(icons[key][imagerep[j]]) === 'number') {
          icons[key][imagerep[j]] = files[icons[key][imagerep[j]]];
        }
      }
    }
    return icons;
  };

})(jQuery);
;
// Getlocations marker image data.
Drupal.getlocations.iconpath = "\/";
Drupal.getlocations.icondata = {"\/circular\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/circular\/":{"f":["shadow.png","add.png","arrow_down.png","arrow_left.png","arrow_right.png","arrows_4_way.png","arrows_east_west.png","arrows_north_east.png","arrows_north_south.png","arrows_south_west.png","arrow_up.png","at.png","book.png","broadcast.png","bulb.png","bullet_black.png","bullet_blue.png","bullet_green.png","bullet_red.png","bullet_yellow.png","cancel.png","cart.png","cd.png","clock.png","cog.png","comment.png","comments.png","copy.png","copyright.png","currency_eur.png","currency_gbp.png","currency_jpn.png","currency_usd.png","cut.png","delete.png","edit.png","element_clouds.png","element_fire.png","element_lightning.png","element_rain_clouds.png","element_sun_cloud.png","element_sun.png","element_water.png","email.png","eye.png","fast_forward.png","flag_black.png","flag_blue.png","flag_green.png","flag_red.png","flag_yellow.png","folder_close.png","folder_document.png","folder_open.png","folder.png","heart_black.png","heart_blue.png","heart_green.png","heart_red.png","heart_yellow.png","help.png","home.png","hourglass.png","information.png","key.png","magnify_minus.png","magnify_plus.png","magnify.png","minus.png","moon.png","music.png","new.png","no.png","omega.png","padlock_closed.png","padlock_open.png","paperclip.png","paste.png","pause.png","phone.png","pie_chart.png","play.png","pointer.png","power_off.png","power_on.png","print.png","puzzle.png","quote.png","refresh.png","rewind.png","rss.png","save.png","share_this.png","smiley_big_grin.png","smiley_flat.png","smiley_frown.png","smiley_smile.png","smiley_tounge.png","smiley_wink.png","speaker_off.png","speaker_on.png","star_black.png","star_blue.png","star_green.png","star_red.png","star_yellow.png","stop.png","tag_black.png","tag_blue.png","tag_green.png","tag_red.png","tag_yellow.png","turn_left.png","turn_right.png","user.png","warning.png","world.png","yes.png"],"w":[28,16,16,16,16,16,16,16,16,16,16,16,16,16,16,6,6,6,6,6,16],"h":[16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,6,6,6,6,6,16],"i":[[[["defaults","circular add","circular arrow_down","circular arrow_left","circular arrow_right","circular arrows_4_way","circular arrows_east_west","circular arrows_north_east","circular arrows_north_south","circular arrows_south_west","circular arrow_up","circular at","circular book","circular broadcast","circular bulb","circular bullet_black","circular bullet_blue","circular bullet_green","circular bullet_red","circular bullet_yellow","circular cancel","circular cart","circular cd","circular clock","circular cog","circular comment","circular comments","circular copy","circular copyright","circular currency_eur","circular currency_gbp","circular currency_jpn","circular currency_usd","circular cut","circular delete","circular edit","circular element_clouds","circular element_fire","circular element_lightning","circular element_rain_clouds","circular element_sun_cloud","circular element_sun","circular element_water","circular email","circular eye","circular fast_forward","circular flag_black","circular flag_blue","circular flag_green","circular flag_red","circular flag_yellow","circular folder_close","circular folder_document","circular folder_open","circular folder","circular heart_black","circular heart_blue","circular heart_green","circular heart_red","circular heart_yellow","circular help","circular home","circular hourglass","circular information","circular key","circular magnify_minus","circular magnify_plus","circular magnify","circular minus","circular moon","circular music","circular new","circular no","circular omega","circular padlock_closed","circular padlock_open","circular paperclip","circular paste","circular pause","circular phone","circular pie_chart","circular play","circular pointer","circular power_off","circular power_on","circular print","circular puzzle","circular quote","circular refresh","circular rewind","circular rss","circular save","circular share_this","circular smiley_big_grin","circular smiley_flat","circular smiley_frown","circular smiley_smile","circular smiley_tounge","circular smiley_wink","circular speaker_off","circular speaker_on","circular star_black","circular star_blue","circular star_green","circular star_red","circular star_yellow","circular stop","circular tag_black","circular tag_blue","circular tag_green","circular tag_red","circular tag_yellow","circular turn_left","circular turn_right","circular user","circular warning","circular world","circular yes"],["","circular add","circular arrow_down","circular arrow_left","circular arrow_right","circular arrows_4_way","circular arrows_east_west","circular arrows_north_east","circular arrows_north_south","circular arrows_south_west","circular arrow_up","circular at","circular book","circular broadcast","circular bulb","circular bullet_black","circular bullet_blue","circular bullet_green","circular bullet_red","circular bullet_yellow","circular cancel","circular cart","circular cd","circular clock","circular cog","circular comment","circular comments","circular copy","circular copyright","circular currency_eur","circular currency_gbp","circular currency_jpn","circular currency_usd","circular cut","circular delete","circular edit","circular element_clouds","circular element_fire","circular element_lightning","circular element_rain_clouds","circular element_sun_cloud","circular element_sun","circular element_water","circular email","circular eye","circular fast_forward","circular flag_black","circular flag_blue","circular flag_green","circular flag_red","circular flag_yellow","circular folder_close","circular folder_document","circular folder_open","circular folder","circular heart_black","circular heart_blue","circular heart_green","circular heart_red","circular heart_yellow","circular help","circular home","circular hourglass","circular information","circular key","circular magnify_minus","circular magnify_plus","circular magnify","circular minus","circular moon","circular music","circular new","circular no","circular omega","circular padlock_closed","circular padlock_open","circular paperclip","circular paste","circular pause","circular phone","circular pie_chart","circular play","circular pointer","circular power_off","circular power_on","circular print","circular puzzle","circular quote","circular refresh","circular rewind","circular rss","circular save","circular share_this","circular smiley_big_grin","circular smiley_flat","circular smiley_frown","circular smiley_smile","circular smiley_tounge","circular smiley_wink","circular speaker_off","circular speaker_on","circular star_black","circular star_blue","circular star_green","circular star_red","circular star_yellow","circular stop","circular tag_black","circular tag_blue","circular tag_green","circular tag_red","circular tag_yellow","circular turn_left","circular turn_right","circular user","circular warning","circular world","circular yes"],[[],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[17],[18],[19],[20],[21],[22],[23],[24],[25],[26],[27],[28],[29],[30],[31],[32],[33],[34],[35],[36],[37],[38],[39],[40],[41],[42],[43],[44],[45],[46],[47],[48],[49],[50],[51],[52],[53],[54],[55],[56],[57],[58],[59],[60],[61],[62],[63],[64],[65],[66],[67],[68],[69],[70],[71],[72],[73],[74],[75],[76],[77],[78],[79],[80],[81],[82],[83],[84],[85],[86],[87],[88],[89],[90],[91],[92],[93],[94],[95],[96],[97],[98],[99],[100],[101],[102],[103],[104],[105],[106],[107],[108],[109],[110],[111],[112],[113],[114],[115],[116],[117]],[0],[0],[8,0],[16,0],[0],[0],[0],[8,0],[16,0],["0,0,16,16",""],["rect",""]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/misc\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/misc\/":{"f":["shadow.png","blank.png","cluster.png","drupal.png","route1.png","route2.png","vertex.png"],"w":[40,20,20,20,20,20,8],"h":[34,34,34,34,34,34,8],"i":[[[["defaults","blank","cluster","drupal","route1","route2","vertex"],["","Blank","Cluster","Drupal","Route 1","Route 2","Line Vertex"],[[],[1],[2],[3],[4],[5],[6]],[0],[0],[10,0,0,0,0,0,4],[34,0,0,0,0,0,8],[0],[0],[0],[10,0],[34,0],["0,0,20,34","","","","","","0,0,16,16"],["rect","","","","","","rect"]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/a_to_z\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/a_to_z\/":{"f":["shadow.png","blue_MarkerA.png","blue_MarkerB.png","blue_MarkerC.png","blue_MarkerD.png","blue_MarkerE.png","blue_MarkerF.png","blue_MarkerG.png","blue_MarkerH.png","blue_MarkerI.png","blue_MarkerJ.png","blue_MarkerK.png","blue_MarkerL.png","blue_MarkerM.png","blue_MarkerN.png","blue_MarkerO.png","blue_MarkerP.png","blue_MarkerQ.png","blue_MarkerR.png","blue_MarkerS.png","blue_MarkerT.png","blue_MarkerU.png","blue_MarkerV.png","blue_MarkerW.png","blue_MarkerX.png","blue_MarkerY.png","blue_MarkerZ.png","brown_MarkerA.png","brown_MarkerB.png","brown_MarkerC.png","brown_MarkerD.png","brown_MarkerE.png","brown_MarkerF.png","brown_MarkerG.png","brown_MarkerH.png","brown_MarkerI.png","brown_MarkerJ.png","brown_MarkerK.png","brown_MarkerL.png","brown_MarkerM.png","brown_MarkerN.png","brown_MarkerO.png","brown_MarkerP.png","brown_MarkerQ.png","brown_MarkerR.png","brown_MarkerS.png","brown_MarkerT.png","brown_MarkerU.png","brown_MarkerV.png","brown_MarkerW.png","brown_MarkerX.png","brown_MarkerY.png","brown_MarkerZ.png","darkgreen_MarkerA.png","darkgreen_MarkerB.png","darkgreen_MarkerC.png","darkgreen_MarkerD.png","darkgreen_MarkerE.png","darkgreen_MarkerF.png","darkgreen_MarkerG.png","darkgreen_MarkerH.png","darkgreen_MarkerI.png","darkgreen_MarkerJ.png","darkgreen_MarkerK.png","darkgreen_MarkerL.png","darkgreen_MarkerM.png","darkgreen_MarkerN.png","darkgreen_MarkerO.png","darkgreen_MarkerP.png","darkgreen_MarkerQ.png","darkgreen_MarkerR.png","darkgreen_MarkerS.png","darkgreen_MarkerT.png","darkgreen_MarkerU.png","darkgreen_MarkerV.png","darkgreen_MarkerW.png","darkgreen_MarkerX.png","darkgreen_MarkerY.png","darkgreen_MarkerZ.png","green_MarkerA.png","green_MarkerB.png","green_MarkerC.png","green_MarkerD.png","green_MarkerE.png","green_MarkerF.png","green_MarkerG.png","green_MarkerH.png","green_MarkerI.png","green_MarkerJ.png","green_MarkerK.png","green_MarkerL.png","green_MarkerM.png","green_MarkerN.png","green_MarkerO.png","green_MarkerP.png","green_MarkerQ.png","green_MarkerR.png","green_MarkerS.png","green_MarkerT.png","green_MarkerU.png","green_MarkerV.png","green_MarkerW.png","green_MarkerX.png","green_MarkerY.png","green_MarkerZ.png","orange_MarkerA.png","orange_MarkerB.png","orange_MarkerC.png","orange_MarkerD.png","orange_MarkerE.png","orange_MarkerF.png","orange_MarkerG.png","orange_MarkerH.png","orange_MarkerI.png","orange_MarkerJ.png","orange_MarkerK.png","orange_MarkerL.png","orange_MarkerM.png","orange_MarkerN.png","orange_MarkerO.png","orange_MarkerP.png","orange_MarkerQ.png","orange_MarkerR.png","orange_MarkerS.png","orange_MarkerT.png","orange_MarkerU.png","orange_MarkerV.png","orange_MarkerW.png","orange_MarkerX.png","orange_MarkerY.png","orange_MarkerZ.png","paleblue_MarkerA.png","paleblue_MarkerB.png","paleblue_MarkerC.png","paleblue_MarkerD.png","paleblue_MarkerE.png","paleblue_MarkerF.png","paleblue_MarkerG.png","paleblue_MarkerH.png","paleblue_MarkerI.png","paleblue_MarkerJ.png","paleblue_MarkerK.png","paleblue_MarkerL.png","paleblue_MarkerM.png","paleblue_MarkerN.png","paleblue_MarkerO.png","paleblue_MarkerP.png","paleblue_MarkerQ.png","paleblue_MarkerR.png","paleblue_MarkerS.png","paleblue_MarkerT.png","paleblue_MarkerU.png","paleblue_MarkerV.png","paleblue_MarkerW.png","paleblue_MarkerX.png","paleblue_MarkerY.png","paleblue_MarkerZ.png","pink_MarkerA.png","pink_MarkerB.png","pink_MarkerC.png","pink_MarkerD.png","pink_MarkerE.png","pink_MarkerF.png","pink_MarkerG.png","pink_MarkerH.png","pink_MarkerI.png","pink_MarkerJ.png","pink_MarkerK.png","pink_MarkerL.png","pink_MarkerM.png","pink_MarkerN.png","pink_MarkerO.png","pink_MarkerP.png","pink_MarkerQ.png","pink_MarkerR.png","pink_MarkerS.png","pink_MarkerT.png","pink_MarkerU.png","pink_MarkerV.png","pink_MarkerW.png","pink_MarkerX.png","pink_MarkerY.png","pink_MarkerZ.png","purple_MarkerA.png","purple_MarkerB.png","purple_MarkerC.png","purple_MarkerD.png","purple_MarkerE.png","purple_MarkerF.png","purple_MarkerG.png","purple_MarkerH.png","purple_MarkerI.png","purple_MarkerJ.png","purple_MarkerK.png","purple_MarkerL.png","purple_MarkerM.png","purple_MarkerN.png","purple_MarkerO.png","purple_MarkerP.png","purple_MarkerQ.png","purple_MarkerR.png","purple_MarkerS.png","purple_MarkerT.png","purple_MarkerU.png","purple_MarkerV.png","purple_MarkerW.png","purple_MarkerX.png","purple_MarkerY.png","purple_MarkerZ.png","red_MarkerA.png","red_MarkerB.png","red_MarkerC.png","red_MarkerD.png","red_MarkerE.png","red_MarkerF.png","red_MarkerG.png","red_MarkerH.png","red_MarkerI.png","red_MarkerJ.png","red_MarkerK.png","red_MarkerL.png","red_MarkerM.png","red_MarkerN.png","red_MarkerO.png","red_MarkerP.png","red_MarkerQ.png","red_MarkerR.png","red_MarkerS.png","red_MarkerT.png","red_MarkerU.png","red_MarkerV.png","red_MarkerW.png","red_MarkerX.png","red_MarkerY.png","red_MarkerZ.png","yellow_MarkerA.png","yellow_MarkerB.png","yellow_MarkerC.png","yellow_MarkerD.png","yellow_MarkerE.png","yellow_MarkerF.png","yellow_MarkerG.png","yellow_MarkerH.png","yellow_MarkerI.png","yellow_MarkerJ.png","yellow_MarkerK.png","yellow_MarkerL.png","yellow_MarkerM.png","yellow_MarkerN.png","yellow_MarkerO.png","yellow_MarkerP.png","yellow_MarkerQ.png","yellow_MarkerR.png","yellow_MarkerS.png","yellow_MarkerT.png","yellow_MarkerU.png","yellow_MarkerV.png","yellow_MarkerW.png","yellow_MarkerX.png","yellow_MarkerY.png","yellow_MarkerZ.png"],"w":[40,20],"h":[34],"i":[[[["defaults","a_to_z blue A","a_to_z blue B","a_to_z blue C","a_to_z blue D","a_to_z blue E","a_to_z blue F","a_to_z blue G","a_to_z blue H","a_to_z blue I","a_to_z blue J","a_to_z blue K","a_to_z blue L","a_to_z blue M","a_to_z blue N","a_to_z blue O","a_to_z blue P","a_to_z blue Q","a_to_z blue R","a_to_z blue S","a_to_z blue T","a_to_z blue U","a_to_z blue V","a_to_z blue W","a_to_z blue X","a_to_z blue Y","a_to_z blue Z","a_to_z brown A","a_to_z brown B","a_to_z brown C","a_to_z brown D","a_to_z brown E","a_to_z brown F","a_to_z brown G","a_to_z brown H","a_to_z brown I","a_to_z brown J","a_to_z brown K","a_to_z brown L","a_to_z brown M","a_to_z brown N","a_to_z brown O","a_to_z brown P","a_to_z brown Q","a_to_z brown R","a_to_z brown S","a_to_z brown T","a_to_z brown U","a_to_z brown V","a_to_z brown W","a_to_z brown X","a_to_z brown Y","a_to_z brown Z","a_to_z darkgreen A","a_to_z darkgreen B","a_to_z darkgreen C","a_to_z darkgreen D","a_to_z darkgreen E","a_to_z darkgreen F","a_to_z darkgreen G","a_to_z darkgreen H","a_to_z darkgreen I","a_to_z darkgreen J","a_to_z darkgreen K","a_to_z darkgreen L","a_to_z darkgreen M","a_to_z darkgreen N","a_to_z darkgreen O","a_to_z darkgreen P","a_to_z darkgreen Q","a_to_z darkgreen R","a_to_z darkgreen S","a_to_z darkgreen T","a_to_z darkgreen U","a_to_z darkgreen V","a_to_z darkgreen W","a_to_z darkgreen X","a_to_z darkgreen Y","a_to_z darkgreen Z","a_to_z green A","a_to_z green B","a_to_z green C","a_to_z green D","a_to_z green E","a_to_z green F","a_to_z green G","a_to_z green H","a_to_z green I","a_to_z green J","a_to_z green K","a_to_z green L","a_to_z green M","a_to_z green N","a_to_z green O","a_to_z green P","a_to_z green Q","a_to_z green R","a_to_z green S","a_to_z green T","a_to_z green U","a_to_z green V","a_to_z green W","a_to_z green X","a_to_z green Y","a_to_z green Z","a_to_z orange A","a_to_z orange B","a_to_z orange C","a_to_z orange D","a_to_z orange E","a_to_z orange F","a_to_z orange G","a_to_z orange H","a_to_z orange I","a_to_z orange J","a_to_z orange K","a_to_z orange L","a_to_z orange M","a_to_z orange N","a_to_z orange O","a_to_z orange P","a_to_z orange Q","a_to_z orange R","a_to_z orange S","a_to_z orange T","a_to_z orange U","a_to_z orange V","a_to_z orange W","a_to_z orange X","a_to_z orange Y","a_to_z orange Z","a_to_z paleblue A","a_to_z paleblue B","a_to_z paleblue C","a_to_z paleblue D","a_to_z paleblue E","a_to_z paleblue F","a_to_z paleblue G","a_to_z paleblue H","a_to_z paleblue I","a_to_z paleblue J","a_to_z paleblue K","a_to_z paleblue L","a_to_z paleblue M","a_to_z paleblue N","a_to_z paleblue O","a_to_z paleblue P","a_to_z paleblue Q","a_to_z paleblue R","a_to_z paleblue S","a_to_z paleblue T","a_to_z paleblue U","a_to_z paleblue V","a_to_z paleblue W","a_to_z paleblue X","a_to_z paleblue Y","a_to_z paleblue Z","a_to_z pink A","a_to_z pink B","a_to_z pink C","a_to_z pink D","a_to_z pink E","a_to_z pink F","a_to_z pink G","a_to_z pink H","a_to_z pink I","a_to_z pink J","a_to_z pink K","a_to_z pink L","a_to_z pink M","a_to_z pink N","a_to_z pink O","a_to_z pink P","a_to_z pink Q","a_to_z pink R","a_to_z pink S","a_to_z pink T","a_to_z pink U","a_to_z pink V","a_to_z pink W","a_to_z pink X","a_to_z pink Y","a_to_z pink Z","a_to_z purple A","a_to_z purple B","a_to_z purple C","a_to_z purple D","a_to_z purple E","a_to_z purple F","a_to_z purple G","a_to_z purple H","a_to_z purple I","a_to_z purple J","a_to_z purple K","a_to_z purple L","a_to_z purple M","a_to_z purple N","a_to_z purple O","a_to_z purple P","a_to_z purple Q","a_to_z purple R","a_to_z purple S","a_to_z purple T","a_to_z purple U","a_to_z purple V","a_to_z purple W","a_to_z purple X","a_to_z purple Y","a_to_z purple Z","a_to_z red A","a_to_z red B","a_to_z red C","a_to_z red D","a_to_z red E","a_to_z red F","a_to_z red G","a_to_z red H","a_to_z red I","a_to_z red J","a_to_z red K","a_to_z red L","a_to_z red M","a_to_z red N","a_to_z red O","a_to_z red P","a_to_z red Q","a_to_z red R","a_to_z red S","a_to_z red T","a_to_z red U","a_to_z red V","a_to_z red W","a_to_z red X","a_to_z red Y","a_to_z red Z","a_to_z yellow A","a_to_z yellow B","a_to_z yellow C","a_to_z yellow D","a_to_z yellow E","a_to_z yellow F","a_to_z yellow G","a_to_z yellow H","a_to_z yellow I","a_to_z yellow J","a_to_z yellow K","a_to_z yellow L","a_to_z yellow M","a_to_z yellow N","a_to_z yellow O","a_to_z yellow P","a_to_z yellow Q","a_to_z yellow R","a_to_z yellow S","a_to_z yellow T","a_to_z yellow U","a_to_z yellow V","a_to_z yellow W","a_to_z yellow X","a_to_z yellow Y","a_to_z yellow Z"],["","Blue A","Blue B","Blue C","Blue D","Blue E","Blue F","Blue G","Blue H","Blue I","Blue J","Blue K","Blue L","Blue M","Blue N","Blue O","Blue P","Blue Q","Blue R","Blue S","Blue T","Blue U","Blue V","Blue W","Blue X","Blue Y","Blue Z","Brown A","Brown B","Brown C","Brown D","Brown E","Brown F","Brown G","Brown H","Brown I","Brown J","Brown K","Brown L","Brown M","Brown N","Brown O","Brown P","Brown Q","Brown R","Brown S","Brown T","Brown U","Brown V","Brown W","Brown X","Brown Y","Brown Z","Dark Green A","Dark Green B","Dark Green C","Dark Green D","Dark Green E","Dark Green F","Dark Green G","Dark Green H","Dark Green I","Dark Green J","Dark Green K","Dark Green L","Dark Green M","Dark Green N","Dark Green O","Dark Green P","Dark Green Q","Dark Green R","Dark Green S","Dark Green T","Dark Green U","Dark Green V","Dark Green W","Dark Green X","Dark Green Y","Dark Green Z","Green A","Green B","Green C","Green D","Green E","Green F","Green G","Green H","Green I","Green J","Green K","Green L","Green M","Green N","Green O","Green P","Green Q","Green R","Green S","Green T","Green U","Green V","Green W","Green X","Green Y","Green Z","Orange A","Orange B","Orange C","Orange D","Orange E","Orange F","Orange G","Orange H","Orange I","Orange J","Orange K","Orange L","Orange M","Orange N","Orange O","Orange P","Orange Q","Orange R","Orange S","Orange T","Orange U","Orange V","Orange W","Orange X","Orange Y","Orange Z","Pale Blue A","Pale Blue B","Pale Blue C","Pale Blue D","Pale Blue E","Pale Blue F","Pale Blue G","Pale Blue H","Pale Blue I","Pale Blue J","Pale Blue K","Pale Blue L","Pale Blue M","Pale Blue N","Pale Blue O","Pale Blue P","Pale Blue Q","Pale Blue R","Pale Blue S","Pale Blue T","Pale Blue U","Pale Blue V","Pale Blue W","Pale Blue X","Pale Blue Y","Pale Blue Z","Pink A","Pink B","Pink C","Pink D","Pink E","Pink F","Pink G","Pink H","Pink I","Pink J","Pink K","Pink L","Pink M","Pink N","Pink O","Pink P","Pink Q","Pink R","Pink S","Pink T","Pink U","Pink V","Pink W","Pink X","Pink Y","Pink Z","Purple A","Purple B","Purple C","Purple D","Purple E","Purple F","Purple G","Purple H","Purple I","Purple J","Purple K","Purple L","Purple M","Purple N","Purple O","Purple P","Purple Q","Purple R","Purple S","Purple T","Purple U","Purple V","Purple W","Purple X","Purple Y","Purple Z","Red A","Red B","Red C","Red D","Red E","Red F","Red G","Red H","Red I","Red J","Red K","Red L","Red M","Red N","Red O","Red P","Red Q","Red R","Red S","Red T","Red U","Red V","Red W","Red X","Red Y","Red Z","Yellow A","Yellow B","Yellow C","Yellow D","Yellow E","Yellow F","Yellow G","Yellow H","Yellow I","Yellow J","Yellow K","Yellow L","Yellow M","Yellow N","Yellow O","Yellow P","Yellow Q","Yellow R","Yellow S","Yellow T","Yellow U","Yellow V","Yellow W","Yellow X","Yellow Y","Yellow Z"],[[],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[17],[18],[19],[20],[21],[22],[23],[24],[25],[26],[27],[28],[29],[30],[31],[32],[33],[34],[35],[36],[37],[38],[39],[40],[41],[42],[43],[44],[45],[46],[47],[48],[49],[50],[51],[52],[53],[54],[55],[56],[57],[58],[59],[60],[61],[62],[63],[64],[65],[66],[67],[68],[69],[70],[71],[72],[73],[74],[75],[76],[77],[78],[79],[80],[81],[82],[83],[84],[85],[86],[87],[88],[89],[90],[91],[92],[93],[94],[95],[96],[97],[98],[99],[100],[101],[102],[103],[104],[105],[106],[107],[108],[109],[110],[111],[112],[113],[114],[115],[116],[117],[118],[119],[120],[121],[122],[123],[124],[125],[126],[127],[128],[129],[130],[131],[132],[133],[134],[135],[136],[137],[138],[139],[140],[141],[142],[143],[144],[145],[146],[147],[148],[149],[150],[151],[152],[153],[154],[155],[156],[157],[158],[159],[160],[161],[162],[163],[164],[165],[166],[167],[168],[169],[170],[171],[172],[173],[174],[175],[176],[177],[178],[179],[180],[181],[182],[183],[184],[185],[186],[187],[188],[189],[190],[191],[192],[193],[194],[195],[196],[197],[198],[199],[200],[201],[202],[203],[204],[205],[206],[207],[208],[209],[210],[211],[212],[213],[214],[215],[216],[217],[218],[219],[220],[221],[222],[223],[224],[225],[226],[227],[228],[229],[230],[231],[232],[233],[234],[235],[236],[237],[238],[239],[240],[241],[242],[243],[244],[245],[246],[247],[248],[249],[250],[251],[252],[253],[254],[255],[256],[257],[258],[259],[260]],[0],[0],[10,0],[34,0],[0],[0],[0],[10,0],[34,0],["0,0,20,34",""],["rect",""]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/various\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/various\/":{"f":["shadow.png","360degrees.png","abduction.png","accesdenied.png","acupuncture.png","administration.png","administrativeboundary.png","aed-2.png","agritourism.png","aircraftcarrier.png","aircraftsmall.png","airport_apron.png","airport.png","airport_runway.png","airport_terminal.png","alien.png","alligator.png","amphitheater-2.png","amphitheater.png","anchorpier.png","animal-shelter-export.png","anniversary.png","ant-export.png","apartment-3.png","apple.png","aquarium.png","archery.png","arch.png","army.png","artgallery.png","atm-2.png","atv.png","audio.png","australianfootball.png","avalanche1.png","award.png","badminton-2.png","bags.png","bank.png","barbecue.png","barber.png","bar_coktail.png","bar_juice.png","bar.png","barrier.png","baseball.png","basketball.png","bats.png","battlefield.png","battleship-3.png","beach.png","beachvolleyball.png","beautifulview.png","beautysalon.png","bigcity.png","billiard-2.png","binoculars.png","birds-2.png","blast.png","boardercross.png","boat.png","bobsleigh.png","bomb.png","bowling.png","boxing.png","bread.png","brewery1.png","bridge_modern.png","bridge_old.png","bulldozer.png","bullfight.png","bunker-2-2.png","bus.png","busstop.png","bustour.png","butcher-2.png","butterfly-2.png","cabin-2.png","cablecar.png","cafetaria.png","calendar-3.png","campfire-2.png","camping-2.png","candy.png","canyon.png","caraccident.png","car.png","carrental.png","carwash.png","casino-2.png","castle-2.png","cathedral.png","catholicgrave.png","caution.png","cave-2.png","cctv.png","cemetary.png","chapel-2.png","chart-2.png","cheese.png","chemistry-2.png","chicken-2.png","childmuseum01.png","chiropractor.png","christmasmarket.png","church-2.png","cinema.png","circus.png","citysquare.png","citywalls.png","climbing.png","clock.png","closedroad.png","clothers_female.png","clothers_male.png","cloudy.png","cloudysunny.png","coffee.png","coins.png","comedyclub.png","comics.png","comment-map-icon.png","communitycentre.png","company.png","compost.png","computers.png","condominium.png","conference.png","congress.png","construction.png","contract.png","conveniencestore.png","convent-2.png","conversation-map-icon.png","corral.png","country.png","court.png","cowabduction.png","cow-export.png","craftstore.png","cramschool.png","cricket.png","crimescene.png","cromlech.png","cropcircles.png","cross-2.png","crossingguard.png","cruiseship.png","cup.png","curling-2.png","currencyexchange.png","customs.png","cycling_feed.png","cycling.png","cycling_sprint.png","dam.png","dance_class.png","dancinghall.png","database.png","daycare.png","deepseafishing.png","deer.png","dentist.png","departmentstore.png","desert-2.png","dinopark.png","direction_down.png","disability.png","diving.png","dogs_leash.png","dolphins.png","doublebendright.png","downloadicon.png","drinkingfountain.png","drinkingwater.png","drugstore.png","duck-export.png","earthquake-3.png","eggs.png","elephants.png","elevator_down.png","elevator.png","elevator_up.png","embassy.png","entrance.png","exit.png","expert.png","factory.png","fallingrocks.png","family.png","farm-2.png","farmstand.png","fastfood.png","female-2.png","ferriswheel.png","ferry.png","fetalalcoholsyndrom.png","field.png","fillingstation.png","findajob.png","finish.png","fireexstinguisher.png","fire-hydrant-2.png","firemen.png","fire.png","fireworks.png","firstaid.png","fishchips.png","fishingboat.png","fishing.png","fishingstore.png","fitness.png","fjord-2.png","flag-export.png","flood.png","flowers.png","folder-2.png","fooddeliveryservice.png","foodtruck.png","ford-2.png","forest2.png","forest.png","fossils.png","fountain-2.png","frog-2.png","fruits.png","gay-female.png","gay-male.png","geyser-2.png","ghosttown.png","gifts.png","glacier-2.png","golfing.png","gondola-2.png","gourmet_0star.png","grass.png","grocery.png","group-2.png","handball.png","hanggliding.png","harbor.png","hats.png","haybale.png","headstone-2.png","helicopter.png","highschool.png","highway.png","hiking.png","historicalquarter.png","homecenter.png","home.png","horseriding.png","hospital-building.png","hostel_0star.png","hotairbaloon.png","hotel_0star.png","hotspring.png","house.png","hunting.png","icecream.png","icehockey.png","iceskating.png","icy_road.png","indoor-arena.png","information.png","jacuzzi.png","japanese-food.png","japanese-lantern.png","japanese-sake.png","japanese-sweet-2.png","japanese-temple.png","jazzclub.png","jetfighter.png","jewelry.png","jewishgrave.png","jewishquarter.png","jogging.png","judo.png","karate.png","karting.png","kayaking.png","kebab.png","kiosk.png","kitesurfing.png","laboratory.png","lake.png","landfill.png","landmark.png","laundromat.png","levelcrossing.png","library.png","lifeguard-2.png","lighthouse-2.png","linedown.png","lingerie.png","liquor.png","lobster-export.png","lockerrental.png","lodging_0star.png","love_date.png","loveinterest.png","magicshow.png","mainroad.png","male-2.png","mall.png","map.png","market.png","massage.png","medicine.png","megalith.png","memorial.png","metronetwork.png","military.png","mine.png","mobilephonetower.png","modernmonument.png","moderntower.png","monkey-export.png","monument.png","mosquee.png","mosquito.png","motel-2.png","motorbike.png","motorcycle.png","mountain-pass-locator-diagonal-reverse-export.png","mountains.png","movierental.png","moving-walkway-enter-export.png","mural.png","museum_archeological.png","museum_art.png","museum_crafts.png","museum_industry.png","museum_naval.png","museum_openair.png","museum_science.png","museum_war.png","mushroom.png","music_choral.png","music_classical.png","music_hiphop.png","music_live.png","music.png","music_rock.png","nanny.png","ne_barn-2.png","newsagent.png","no-nuke-export.png","nordicski.png","notvisited.png","nursery.png","observatory.png","oilpumpjack.png","olympicsite.png","ophthalmologist.png","pagoda-2.png","paintball.png","paint.png","palace-2.png","palm-tree-export.png","panoramicview.png","paragliding.png","parkandride.png","parking-meter-export.png","parking.png","party-2.png","patisserie.png","peace.png","pedestriancrossing.png","penguin-2.png","pens.png","perfumery.png","petanque.png","petroglyphs-2.png","pets.png","phantom.png","phones.png","photography.png","photo.png","picnic-2.png","pig.png","pin-export.png","pirates.png","pizzaria.png","planecrash.png","planetarium-2.png","playground.png","pleasurepier.png","poker.png","police.png","postal.png","powerlinepole.png","poweroutage.png","powerplant.png","powersubstation.png","prayer.png","presentation.png","price-tag-export.png","printer-2.png","prison.png","publicart.png","pyramid.png","quadrifoglio.png","radar.png","radiation.png","rainy.png","rape.png","recycle.png","regroup.png","repair.png","rescue-2.png","resort.png","restaurant_african.png","restaurant_breakfast.png","restaurant_buffet.png","restaurant_chinese.png","restaurant_fish.png","restaurant_greek.png","restaurant_indian.png","restaurant_italian.png","restaurant_korean.png","restaurant_mediterranean.png","restaurant_mexican.png","restaurant.png","restaurant_romantic.png","restaurant_steakhouse.png","restaurant_tapas.png","restaurant_thai.png","restaurant_turkish.png","restaurant_vegetarian.png","revolt.png","riparianhabitat.png","roadtype_gravel.png","rockhouse.png","rodent.png","rollerskate.png","ropescourse.png","rowboat.png","rugbyfield.png","ruins-2.png","sailing.png","sandwich-2.png","sauna.png","sawmill-2.png","school.png","scubadiving.png","seals.png","segway.png","seniorsite.png","share.png","shark-export.png","shintoshrine.png","shipwreck.png","shoes.png","shooting.png","shore-2.png","shower.png","sight-2.png","signpost-2.png","sikh.png","skiing.png","skijump.png","skilifting.png","skull.png","sledge.png","sledgerental.png","sledge_summer.png","smallcity.png","smiley_happy.png","smoking.png","snail.png","snakes.png","sneakers.png","snorkeling.png","snowboarding.png","snowmobiling.png","snowpark_arc.png","snowshoeing.png","snowy-2.png","soccer.png","solarenergy.png","spaceport-2.png","spa.png","speed_50.png","speedhump.png","speedriding.png","spelunking.png","spider.png","sportutilityvehicle.png","squash-2.png","stadium.png","star-3.png","stargate-raw.png","statue-2.png","steamtrain.png","stop.png","strike.png","submarine-2.png","sugar-shack.png","summercamp.png","sumo-2.png","sunny.png","supermarket.png","surfacelift.png","surfing.png","surveying-2.png","swimming.png","synagogue-2.png","taekwondo-2.png","tailor.png","takeaway.png","taxi.png","taxiway.png","teahouse.png","tebletennis.png","telephone.png","temple-2.png","templehindu.png","tennis.png","terrace.png","textiles.png","text.png","theater.png","theft.png","themepark.png","therapy.png","thunderstorm.png","tiger-2.png","tires.png","toilets.png","tollstation.png","tools.png","tornado-2.png","torture.png","tower.png","toys.png","trafficcamera.png","trafficlight.png","train.png","tramway.png","trash.png","treedown.png","trolley.png","truck3.png","tsunami.png","tunnel.png","tweet.png","ufo.png","underground.png","university.png","u-pick_stand.png","usfootball.png","van.png","vespa.png","veterinary.png","videogames.png","video.png","villa.png","vineyard-2.png","volcano-2.png","volleyball.png","waiting.png","walkingtour.png","war.png","watercraft.png","waterfall-2.png","watermill-2.png","waterpark.png","waterskiing.png","watertower.png","waterwell.png","waterwellpump.png","webcam.png","wedding.png","weights.png","wetlands.png","whale-2.png","wifi.png","wiki-export.png","wildlifecrossing.png","wind-2.png","windmill-2.png","windsurfing.png","windturbine.png","winebar.png","winetasting.png","workoffice.png","worldheritagesite.png","world.png","wrestling-2.png","yoga.png","yooner.png","youthhostel.png","zoom.png","zoo.png"],"w":[54,32],"h":[37],"i":[[[["defaults","various 360degrees","various abduction","various accesdenied","various acupuncture","various administration","various administrativeboundary","various aed-2","various agritourism","various aircraftcarrier","various aircraftsmall","various airport_apron","various airport","various airport_runway","various airport_terminal","various alien","various alligator","various amphitheater-2","various amphitheater","various anchorpier","various animal-shelter-export","various anniversary","various ant-export","various apartment-3","various apple","various aquarium","various archery","various arch","various army","various artgallery","various atm-2","various atv","various audio","various australianfootball","various avalanche1","various award","various badminton-2","various bags","various bank","various barbecue","various barber","various bar_coktail","various bar_juice","various bar","various barrier","various baseball","various basketball","various bats","various battlefield","various battleship-3","various beach","various beachvolleyball","various beautifulview","various beautysalon","various bigcity","various billiard-2","various binoculars","various birds-2","various blast","various boardercross","various boat","various bobsleigh","various bomb","various bowling","various boxing","various bread","various brewery1","various bridge_modern","various bridge_old","various bulldozer","various bullfight","various bunker-2-2","various bus","various busstop","various bustour","various butcher-2","various butterfly-2","various cabin-2","various cablecar","various cafetaria","various calendar-3","various campfire-2","various camping-2","various candy","various canyon","various caraccident","various car","various carrental","various carwash","various casino-2","various castle-2","various cathedral","various catholicgrave","various caution","various cave-2","various cctv","various cemetary","various chapel-2","various chart-2","various cheese","various chemistry-2","various chicken-2","various childmuseum01","various chiropractor","various christmasmarket","various church-2","various cinema","various circus","various citysquare","various citywalls","various climbing","various clock","various closedroad","various clothers_female","various clothers_male","various cloudy","various cloudysunny","various coffee","various coins","various comedyclub","various comics","various comment-map-icon","various communitycentre","various company","various compost","various computers","various condominium","various conference","various congress","various construction","various contract","various conveniencestore","various convent-2","various conversation-map-icon","various corral","various country","various court","various cowabduction","various cow-export","various craftstore","various cramschool","various cricket","various crimescene","various cromlech","various cropcircles","various cross-2","various crossingguard","various cruiseship","various cup","various curling-2","various currencyexchange","various customs","various cycling_feed","various cycling","various cycling_sprint","various dam","various dance_class","various dancinghall","various database","various daycare","various deepseafishing","various deer","various dentist","various departmentstore","various desert-2","various dinopark","various direction_down","various disability","various diving","various dogs_leash","various dolphins","various doublebendright","various downloadicon","various drinkingfountain","various drinkingwater","various drugstore","various duck-export","various earthquake-3","various eggs","various elephants","various elevator_down","various elevator","various elevator_up","various embassy","various entrance","various exit","various expert","various factory","various fallingrocks","various family","various farm-2","various farmstand","various fastfood","various female-2","various ferriswheel","various ferry","various fetalalcoholsyndrom","various field","various fillingstation","various findajob","various finish","various fireexstinguisher","various fire-hydrant-2","various firemen","various fire","various fireworks","various firstaid","various fishchips","various fishingboat","various fishing","various fishingstore","various fitness","various fjord-2","various flag-export","various flood","various flowers","various folder-2","various fooddeliveryservice","various foodtruck","various ford-2","various forest2","various forest","various fossils","various fountain-2","various frog-2","various fruits","various gay-female","various gay-male","various geyser-2","various ghosttown","various gifts","various glacier-2","various golfing","various gondola-2","various gourmet_0star","various grass","various grocery","various group-2","various handball","various hanggliding","various harbor","various hats","various haybale","various headstone-2","various helicopter","various highschool","various highway","various hiking","various historicalquarter","various homecenter","various home","various horseriding","various hospital-building","various hostel_0star","various hotairbaloon","various hotel_0star","various hotspring","various house","various hunting","various icecream","various icehockey","various iceskating","various icy_road","various indoor-arena","various information","various jacuzzi","various japanese-food","various japanese-lantern","various japanese-sake","various japanese-sweet-2","various japanese-temple","various jazzclub","various jetfighter","various jewelry","various jewishgrave","various jewishquarter","various jogging","various judo","various karate","various karting","various kayaking","various kebab","various kiosk","various kitesurfing","various laboratory","various lake","various landfill","various landmark","various laundromat","various levelcrossing","various library","various lifeguard-2","various lighthouse-2","various linedown","various lingerie","various liquor","various lobster-export","various lockerrental","various lodging_0star","various love_date","various loveinterest","various magicshow","various mainroad","various male-2","various mall","various map","various market","various massage","various medicine","various megalith","various memorial","various metronetwork","various military","various mine","various mobilephonetower","various modernmonument","various moderntower","various monkey-export","various monument","various mosquee","various mosquito","various motel-2","various motorbike","various motorcycle","various mountain-pass-locator-diagonal-reverse-export","various mountains","various movierental","various moving-walkway-enter-export","various mural","various museum_archeological","various museum_art","various museum_crafts","various museum_industry","various museum_naval","various museum_openair","various museum_science","various museum_war","various mushroom","various music_choral","various music_classical","various music_hiphop","various music_live","various music","various music_rock","various nanny","various ne_barn-2","various newsagent","various no-nuke-export","various nordicski","various notvisited","various nursery","various observatory","various oilpumpjack","various olympicsite","various ophthalmologist","various pagoda-2","various paintball","various paint","various palace-2","various palm-tree-export","various panoramicview","various paragliding","various parkandride","various parking-meter-export","various parking","various party-2","various patisserie","various peace","various pedestriancrossing","various penguin-2","various pens","various perfumery","various petanque","various petroglyphs-2","various pets","various phantom","various phones","various photography","various photo","various picnic-2","various pig","various pin-export","various pirates","various pizzaria","various planecrash","various planetarium-2","various playground","various pleasurepier","various poker","various police","various postal","various powerlinepole","various poweroutage","various powerplant","various powersubstation","various prayer","various presentation","various price-tag-export","various printer-2","various prison","various publicart","various pyramid","various quadrifoglio","various radar","various radiation","various rainy","various rape","various recycle","various regroup","various repair","various rescue-2","various resort","various restaurant_african","various restaurant_breakfast","various restaurant_buffet","various restaurant_chinese","various restaurant_fish","various restaurant_greek","various restaurant_indian","various restaurant_italian","various restaurant_korean","various restaurant_mediterranean","various restaurant_mexican","various restaurant","various restaurant_romantic","various restaurant_steakhouse","various restaurant_tapas","various restaurant_thai","various restaurant_turkish","various restaurant_vegetarian","various revolt","various riparianhabitat","various roadtype_gravel","various rockhouse","various rodent","various rollerskate","various ropescourse","various rowboat","various rugbyfield","various ruins-2","various sailing","various sandwich-2","various sauna","various sawmill-2","various school","various scubadiving","various seals","various segway","various seniorsite","various share","various shark-export","various shintoshrine","various shipwreck","various shoes","various shooting","various shore-2","various shower","various sight-2","various signpost-2","various sikh","various skiing","various skijump","various skilifting","various skull","various sledge","various sledgerental","various sledge_summer","various smallcity","various smiley_happy","various smoking","various snail","various snakes","various sneakers","various snorkeling","various snowboarding","various snowmobiling","various snowpark_arc","various snowshoeing","various snowy-2","various soccer","various solarenergy","various spaceport-2","various spa","various speed_50","various speedhump","various speedriding","various spelunking","various spider","various sportutilityvehicle","various squash-2","various stadium","various star-3","various stargate-raw","various statue-2","various steamtrain","various stop","various strike","various submarine-2","various sugar-shack","various summercamp","various sumo-2","various sunny","various supermarket","various surfacelift","various surfing","various surveying-2","various swimming","various synagogue-2","various taekwondo-2","various tailor","various takeaway","various taxi","various taxiway","various teahouse","various tebletennis","various telephone","various temple-2","various templehindu","various tennis","various terrace","various textiles","various text","various theater","various theft","various themepark","various therapy","various thunderstorm","various tiger-2","various tires","various toilets","various tollstation","various tools","various tornado-2","various torture","various tower","various toys","various trafficcamera","various trafficlight","various train","various tramway","various trash","various treedown","various trolley","various truck3","various tsunami","various tunnel","various tweet","various ufo","various underground","various university","various u-pick_stand","various usfootball","various van","various vespa","various veterinary","various videogames","various video","various villa","various vineyard-2","various volcano-2","various volleyball","various waiting","various walkingtour","various war","various watercraft","various waterfall-2","various watermill-2","various waterpark","various waterskiing","various watertower","various waterwell","various waterwellpump","various webcam","various wedding","various weights","various wetlands","various whale-2","various wifi","various wiki-export","various wildlifecrossing","various wind-2","various windmill-2","various windsurfing","various windturbine","various winebar","various winetasting","various workoffice","various worldheritagesite","various world","various wrestling-2","various yoga","various yooner","various youthhostel","various zoom","various zoo"],["","various 360degrees","various abduction","various accesdenied","various acupuncture","various administration","various administrativeboundary","various aed-2","various agritourism","various aircraftcarrier","various aircraftsmall","various airport_apron","various airport","various airport_runway","various airport_terminal","various alien","various alligator","various amphitheater-2","various amphitheater","various anchorpier","various animal-shelter-export","various anniversary","various ant-export","various apartment-3","various apple","various aquarium","various archery","various arch","various army","various artgallery","various atm-2","various atv","various audio","various australianfootball","various avalanche1","various award","various badminton-2","various bags","various bank","various barbecue","various barber","various bar_coktail","various bar_juice","various bar","various barrier","various baseball","various basketball","various bats","various battlefield","various battleship-3","various beach","various beachvolleyball","various beautifulview","various beautysalon","various bigcity","various billiard-2","various binoculars","various birds-2","various blast","various boardercross","various boat","various bobsleigh","various bomb","various bowling","various boxing","various bread","various brewery1","various bridge_modern","various bridge_old","various bulldozer","various bullfight","various bunker-2-2","various bus","various busstop","various bustour","various butcher-2","various butterfly-2","various cabin-2","various cablecar","various cafetaria","various calendar-3","various campfire-2","various camping-2","various candy","various canyon","various caraccident","various car","various carrental","various carwash","various casino-2","various castle-2","various cathedral","various catholicgrave","various caution","various cave-2","various cctv","various cemetary","various chapel-2","various chart-2","various cheese","various chemistry-2","various chicken-2","various childmuseum01","various chiropractor","various christmasmarket","various church-2","various cinema","various circus","various citysquare","various citywalls","various climbing","various clock","various closedroad","various clothers_female","various clothers_male","various cloudy","various cloudysunny","various coffee","various coins","various comedyclub","various comics","various comment-map-icon","various communitycentre","various company","various compost","various computers","various condominium","various conference","various congress","various construction","various contract","various conveniencestore","various convent-2","various conversation-map-icon","various corral","various country","various court","various cowabduction","various cow-export","various craftstore","various cramschool","various cricket","various crimescene","various cromlech","various cropcircles","various cross-2","various crossingguard","various cruiseship","various cup","various curling-2","various currencyexchange","various customs","various cycling_feed","various cycling","various cycling_sprint","various dam","various dance_class","various dancinghall","various database","various daycare","various deepseafishing","various deer","various dentist","various departmentstore","various desert-2","various dinopark","various direction_down","various disability","various diving","various dogs_leash","various dolphins","various doublebendright","various downloadicon","various drinkingfountain","various drinkingwater","various drugstore","various duck-export","various earthquake-3","various eggs","various elephants","various elevator_down","various elevator","various elevator_up","various embassy","various entrance","various exit","various expert","various factory","various fallingrocks","various family","various farm-2","various farmstand","various fastfood","various female-2","various ferriswheel","various ferry","various fetalalcoholsyndrom","various field","various fillingstation","various findajob","various finish","various fireexstinguisher","various fire-hydrant-2","various firemen","various fire","various fireworks","various firstaid","various fishchips","various fishingboat","various fishing","various fishingstore","various fitness","various fjord-2","various flag-export","various flood","various flowers","various folder-2","various fooddeliveryservice","various foodtruck","various ford-2","various forest2","various forest","various fossils","various fountain-2","various frog-2","various fruits","various gay-female","various gay-male","various geyser-2","various ghosttown","various gifts","various glacier-2","various golfing","various gondola-2","various gourmet_0star","various grass","various grocery","various group-2","various handball","various hanggliding","various harbor","various hats","various haybale","various headstone-2","various helicopter","various highschool","various highway","various hiking","various historicalquarter","various homecenter","various home","various horseriding","various hospital-building","various hostel_0star","various hotairbaloon","various hotel_0star","various hotspring","various house","various hunting","various icecream","various icehockey","various iceskating","various icy_road","various indoor-arena","various information","various jacuzzi","various japanese-food","various japanese-lantern","various japanese-sake","various japanese-sweet-2","various japanese-temple","various jazzclub","various jetfighter","various jewelry","various jewishgrave","various jewishquarter","various jogging","various judo","various karate","various karting","various kayaking","various kebab","various kiosk","various kitesurfing","various laboratory","various lake","various landfill","various landmark","various laundromat","various levelcrossing","various library","various lifeguard-2","various lighthouse-2","various linedown","various lingerie","various liquor","various lobster-export","various lockerrental","various lodging_0star","various love_date","various loveinterest","various magicshow","various mainroad","various male-2","various mall","various map","various market","various massage","various medicine","various megalith","various memorial","various metronetwork","various military","various mine","various mobilephonetower","various modernmonument","various moderntower","various monkey-export","various monument","various mosquee","various mosquito","various motel-2","various motorbike","various motorcycle","various mountain-pass-locator-diagonal-reverse-export","various mountains","various movierental","various moving-walkway-enter-export","various mural","various museum_archeological","various museum_art","various museum_crafts","various museum_industry","various museum_naval","various museum_openair","various museum_science","various museum_war","various mushroom","various music_choral","various music_classical","various music_hiphop","various music_live","various music","various music_rock","various nanny","various ne_barn-2","various newsagent","various no-nuke-export","various nordicski","various notvisited","various nursery","various observatory","various oilpumpjack","various olympicsite","various ophthalmologist","various pagoda-2","various paintball","various paint","various palace-2","various palm-tree-export","various panoramicview","various paragliding","various parkandride","various parking-meter-export","various parking","various party-2","various patisserie","various peace","various pedestriancrossing","various penguin-2","various pens","various perfumery","various petanque","various petroglyphs-2","various pets","various phantom","various phones","various photography","various photo","various picnic-2","various pig","various pin-export","various pirates","various pizzaria","various planecrash","various planetarium-2","various playground","various pleasurepier","various poker","various police","various postal","various powerlinepole","various poweroutage","various powerplant","various powersubstation","various prayer","various presentation","various price-tag-export","various printer-2","various prison","various publicart","various pyramid","various quadrifoglio","various radar","various radiation","various rainy","various rape","various recycle","various regroup","various repair","various rescue-2","various resort","various restaurant_african","various restaurant_breakfast","various restaurant_buffet","various restaurant_chinese","various restaurant_fish","various restaurant_greek","various restaurant_indian","various restaurant_italian","various restaurant_korean","various restaurant_mediterranean","various restaurant_mexican","various restaurant","various restaurant_romantic","various restaurant_steakhouse","various restaurant_tapas","various restaurant_thai","various restaurant_turkish","various restaurant_vegetarian","various revolt","various riparianhabitat","various roadtype_gravel","various rockhouse","various rodent","various rollerskate","various ropescourse","various rowboat","various rugbyfield","various ruins-2","various sailing","various sandwich-2","various sauna","various sawmill-2","various school","various scubadiving","various seals","various segway","various seniorsite","various share","various shark-export","various shintoshrine","various shipwreck","various shoes","various shooting","various shore-2","various shower","various sight-2","various signpost-2","various sikh","various skiing","various skijump","various skilifting","various skull","various sledge","various sledgerental","various sledge_summer","various smallcity","various smiley_happy","various smoking","various snail","various snakes","various sneakers","various snorkeling","various snowboarding","various snowmobiling","various snowpark_arc","various snowshoeing","various snowy-2","various soccer","various solarenergy","various spaceport-2","various spa","various speed_50","various speedhump","various speedriding","various spelunking","various spider","various sportutilityvehicle","various squash-2","various stadium","various star-3","various stargate-raw","various statue-2","various steamtrain","various stop","various strike","various submarine-2","various sugar-shack","various summercamp","various sumo-2","various sunny","various supermarket","various surfacelift","various surfing","various surveying-2","various swimming","various synagogue-2","various taekwondo-2","various tailor","various takeaway","various taxi","various taxiway","various teahouse","various tebletennis","various telephone","various temple-2","various templehindu","various tennis","various terrace","various textiles","various text","various theater","various theft","various themepark","various therapy","various thunderstorm","various tiger-2","various tires","various toilets","various tollstation","various tools","various tornado-2","various torture","various tower","various toys","various trafficcamera","various trafficlight","various train","various tramway","various trash","various treedown","various trolley","various truck3","various tsunami","various tunnel","various tweet","various ufo","various underground","various university","various u-pick_stand","various usfootball","various van","various vespa","various veterinary","various videogames","various video","various villa","various vineyard-2","various volcano-2","various volleyball","various waiting","various walkingtour","various war","various watercraft","various waterfall-2","various watermill-2","various waterpark","various waterskiing","various watertower","various waterwell","various waterwellpump","various webcam","various wedding","various weights","various wetlands","various whale-2","various wifi","various wiki-export","various wildlifecrossing","various wind-2","various windmill-2","various windsurfing","various windturbine","various winebar","various winetasting","various workoffice","various worldheritagesite","various world","various wrestling-2","various yoga","various yooner","various youthhostel","various zoom","various zoo"],[[],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[17],[18],[19],[20],[21],[22],[23],[24],[25],[26],[27],[28],[29],[30],[31],[32],[33],[34],[35],[36],[37],[38],[39],[40],[41],[42],[43],[44],[45],[46],[47],[48],[49],[50],[51],[52],[53],[54],[55],[56],[57],[58],[59],[60],[61],[62],[63],[64],[65],[66],[67],[68],[69],[70],[71],[72],[73],[74],[75],[76],[77],[78],[79],[80],[81],[82],[83],[84],[85],[86],[87],[88],[89],[90],[91],[92],[93],[94],[95],[96],[97],[98],[99],[100],[101],[102],[103],[104],[105],[106],[107],[108],[109],[110],[111],[112],[113],[114],[115],[116],[117],[118],[119],[120],[121],[122],[123],[124],[125],[126],[127],[128],[129],[130],[131],[132],[133],[134],[135],[136],[137],[138],[139],[140],[141],[142],[143],[144],[145],[146],[147],[148],[149],[150],[151],[152],[153],[154],[155],[156],[157],[158],[159],[160],[161],[162],[163],[164],[165],[166],[167],[168],[169],[170],[171],[172],[173],[174],[175],[176],[177],[178],[179],[180],[181],[182],[183],[184],[185],[186],[187],[188],[189],[190],[191],[192],[193],[194],[195],[196],[197],[198],[199],[200],[201],[202],[203],[204],[205],[206],[207],[208],[209],[210],[211],[212],[213],[214],[215],[216],[217],[218],[219],[220],[221],[222],[223],[224],[225],[226],[227],[228],[229],[230],[231],[232],[233],[234],[235],[236],[237],[238],[239],[240],[241],[242],[243],[244],[245],[246],[247],[248],[249],[250],[251],[252],[253],[254],[255],[256],[257],[258],[259],[260],[261],[262],[263],[264],[265],[266],[267],[268],[269],[270],[271],[272],[273],[274],[275],[276],[277],[278],[279],[280],[281],[282],[283],[284],[285],[286],[287],[288],[289],[290],[291],[292],[293],[294],[295],[296],[297],[298],[299],[300],[301],[302],[303],[304],[305],[306],[307],[308],[309],[310],[311],[312],[313],[314],[315],[316],[317],[318],[319],[320],[321],[322],[323],[324],[325],[326],[327],[328],[329],[330],[331],[332],[333],[334],[335],[336],[337],[338],[339],[340],[341],[342],[343],[344],[345],[346],[347],[348],[349],[350],[351],[352],[353],[354],[355],[356],[357],[358],[359],[360],[361],[362],[363],[364],[365],[366],[367],[368],[369],[370],[371],[372],[373],[374],[375],[376],[377],[378],[379],[380],[381],[382],[383],[384],[385],[386],[387],[388],[389],[390],[391],[392],[393],[394],[395],[396],[397],[398],[399],[400],[401],[402],[403],[404],[405],[406],[407],[408],[409],[410],[411],[412],[413],[414],[415],[416],[417],[418],[419],[420],[421],[422],[423],[424],[425],[426],[427],[428],[429],[430],[431],[432],[433],[434],[435],[436],[437],[438],[439],[440],[441],[442],[443],[444],[445],[446],[447],[448],[449],[450],[451],[452],[453],[454],[455],[456],[457],[458],[459],[460],[461],[462],[463],[464],[465],[466],[467],[468],[469],[470],[471],[472],[473],[474],[475],[476],[477],[478],[479],[480],[481],[482],[483],[484],[485],[486],[487],[488],[489],[490],[491],[492],[493],[494],[495],[496],[497],[498],[499],[500],[501],[502],[503],[504],[505],[506],[507],[508],[509],[510],[511],[512],[513],[514],[515],[516],[517],[518],[519],[520],[521],[522],[523],[524],[525],[526],[527],[528],[529],[530],[531],[532],[533],[534],[535],[536],[537],[538],[539],[540],[541],[542],[543],[544],[545],[546],[547],[548],[549],[550],[551],[552],[553],[554],[555],[556],[557],[558],[559],[560],[561],[562],[563],[564],[565],[566],[567],[568],[569],[570],[571],[572],[573],[574],[575],[576],[577],[578],[579],[580],[581],[582],[583],[584],[585],[586],[587],[588],[589],[590],[591],[592],[593],[594]],[0],[0],[16,0],[37,0],[0],[0],[0],[16,0],[37,0],["0,0,32,37",""],["rect",""]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/hairlines\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/hairlines\/":{"f":["hairline_large.png","hairline_medium.png","hairline_small.png"],"w":[51,35,21],"h":[51,35,21],"i":[[[["defaults","hairline large","hairline medium","hairline small"],["","Hairline large","Hairline medium","Hairline small"],[[],[0],[1],[2]],[0],[0],[0,25,17,10],[0,25,17,10],[""],[0],[0],[0],[0],["","0,0,50,50","0,0,34,34","0,0,20,20"],["","rect"]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/flat\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/flat\/":{"f":["x.png"],"w":[16],"h":[16],"i":[[[["defaults","treasure"],["","X marks the spot"],[[],[0]],[0],[0],[8,0],[8,0]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/colors\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/colors\/":{"f":["shadow.png","blue.png","gray.png","green.png","lblue.png","orange.png","pink.png","purple.png","white.png","yellow.png"],"w":[40,20],"h":[34],"i":[[[["defaults","blue","gray","green","lblue","orange","pink","purple","white","yellow"],["","Blue","Gray","Green","Light Blue","Orange","Pink","Purple","White","Yellow"],[[],[1],[2],[3],[4],[5],[6],[7],[8],[9]],[0],[0],[10,0],[34,0],[0],[0],[0],[10,0],[34,0],["0,0,20,34",""],["rect",""]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/restaurants-bars\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/restaurants-bars\/":{"f":["shadow.png","barbecue.png","bar_coktail.png","bar_juice.png","bar.png","cafetaria.png","coffee.png","cruiseship.png","fastfood.png","fishchips.png","fooddeliveryservice.png","foodtruck.png","gay-female.png","gay-male.png","gourmet_0star.png","hostel_0star.png","hotel_0star.png","icecream.png","japanese-food.png","japanese-sake.png","kebab.png","lodging_0star.png","motel-2.png","pizzaria.png","resort.png","restaurant_african.png","restaurant_breakfast.png","restaurant_buffet.png","restaurant_chinese.png","restaurant_fish.png","restaurant_greek.png","restaurant_indian.png","restaurant_italian.png","restaurant_korean.png","restaurant_mediterranean.png","restaurant_mexican.png","restaurant.png","restaurant_romantic.png","restaurant_steakhouse.png","restaurant_tapas.png","restaurant_thai.png","restaurant_turkish.png","restaurant_vegetarian.png","sandwich-2.png","takeaway.png","teahouse.png","terrace.png","villa.png","wifi.png","winebar.png","winetasting.png","youthhostel.png"],"w":[54,32],"h":[37],"i":[[[["defaults","restaurants-bars barbecue","restaurants-bars bar_coktail","restaurants-bars bar_juice","restaurants-bars bar","restaurants-bars cafetaria","restaurants-bars coffee","restaurants-bars cruiseship","restaurants-bars fastfood","restaurants-bars fishchips","restaurants-bars fooddeliveryservice","restaurants-bars foodtruck","restaurants-bars gay-female","restaurants-bars gay-male","restaurants-bars gourmet_0star","restaurants-bars hostel_0star","restaurants-bars hotel_0star","restaurants-bars icecream","restaurants-bars japanese-food","restaurants-bars japanese-sake","restaurants-bars kebab","restaurants-bars lodging_0star","restaurants-bars motel-2","restaurants-bars pizzaria","restaurants-bars resort","restaurants-bars restaurant_african","restaurants-bars restaurant_breakfast","restaurants-bars restaurant_buffet","restaurants-bars restaurant_chinese","restaurants-bars restaurant_fish","restaurants-bars restaurant_greek","restaurants-bars restaurant_indian","restaurants-bars restaurant_italian","restaurants-bars restaurant_korean","restaurants-bars restaurant_mediterranean","restaurants-bars restaurant_mexican","restaurants-bars restaurant","restaurants-bars restaurant_romantic","restaurants-bars restaurant_steakhouse","restaurants-bars restaurant_tapas","restaurants-bars restaurant_thai","restaurants-bars restaurant_turkish","restaurants-bars restaurant_vegetarian","restaurants-bars sandwich-2","restaurants-bars takeaway","restaurants-bars teahouse","restaurants-bars terrace","restaurants-bars villa","restaurants-bars wifi","restaurants-bars winebar","restaurants-bars winetasting","restaurants-bars youthhostel"],["","restaurants-bars barbecue","restaurants-bars bar_coktail","restaurants-bars bar_juice","restaurants-bars bar","restaurants-bars cafetaria","restaurants-bars coffee","restaurants-bars cruiseship","restaurants-bars fastfood","restaurants-bars fishchips","restaurants-bars fooddeliveryservice","restaurants-bars foodtruck","restaurants-bars gay-female","restaurants-bars gay-male","restaurants-bars gourmet_0star","restaurants-bars hostel_0star","restaurants-bars hotel_0star","restaurants-bars icecream","restaurants-bars japanese-food","restaurants-bars japanese-sake","restaurants-bars kebab","restaurants-bars lodging_0star","restaurants-bars motel-2","restaurants-bars pizzaria","restaurants-bars resort","restaurants-bars restaurant_african","restaurants-bars restaurant_breakfast","restaurants-bars restaurant_buffet","restaurants-bars restaurant_chinese","restaurants-bars restaurant_fish","restaurants-bars restaurant_greek","restaurants-bars restaurant_indian","restaurants-bars restaurant_italian","restaurants-bars restaurant_korean","restaurants-bars restaurant_mediterranean","restaurants-bars restaurant_mexican","restaurants-bars restaurant","restaurants-bars restaurant_romantic","restaurants-bars restaurant_steakhouse","restaurants-bars restaurant_tapas","restaurants-bars restaurant_thai","restaurants-bars restaurant_turkish","restaurants-bars restaurant_vegetarian","restaurants-bars sandwich-2","restaurants-bars takeaway","restaurants-bars teahouse","restaurants-bars terrace","restaurants-bars villa","restaurants-bars wifi","restaurants-bars winebar","restaurants-bars winetasting","restaurants-bars youthhostel"],[[],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[17],[18],[19],[20],[21],[22],[23],[24],[25],[26],[27],[28],[29],[30],[31],[32],[33],[34],[35],[36],[37],[38],[39],[40],[41],[42],[43],[44],[45],[46],[47],[48],[49],[50],[51]],[0],[0],[16,0],[37,0],[0],[0],[0],[16,0],[37,0],["0,0,32,37",""],["rect",""]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/days\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/days\/":{"f":["shadow.png","marker_sunday.png","marker_monday.png","marker_tuesday.png","marker_wednesday.png","marker_thursday.png","marker_friday.png","marker_saturday.png"],"w":[40,20],"h":[34],"i":[[[["defaults","sunday","monday","tuesday","wednesday","thursday","friday","saturday"],["","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],[[],[1],[2],[3],[4],[5],[6],[7]],[0],[0],[10,0],[34,0],[0],[0],[0],[10,0],[34,0],["0,0,20,34",""],["rect",""]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/big\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/big\/":{"f":["shadow.png","blue.png","red.png"],"w":[56,30],"h":[51],"i":[[[["defaults","big blue","big red"],["","Big Blue","Big Red"],[[],[1],[2]],[0],[0],[15,0],[51,0],[0],[0],[0],[15,0],[51,0],["0,0,30,51",""],["rect",""]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/small\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/small\/":{"f":["shadow.png","red.png","bred.png","orange.png","pyellow.png","yellow.png","pgreen.png","green.png","dgreen.png","fgreen.png","pblue.png","lblue.png","blue.png","dblue.png","purple.png","pink.png","bpink.png","brown.png","white.png","lgray.png","gray.png","black.png","altblue.png","altred.png"],"w":[26,12],"h":[20],"i":[[[["defaults","small red","small bred","small orange","small pyellow","small yellow","small pgreen","small green","small dgreen","small fgreen","small pblue","small lblue","small blue","small dblue","small purple","small pink","small bpink","small brown","small white","small lgray","small gray","small black","alt small blue","alt small red"],["","Small Red","Small Bright red","Small Orange","Small Pale Yellow","Small Yellow","Small Pale Green","Small Green","Small Dark Green","Small Flouro Green","Small Pale Blue","Small Light Blue","Small Blue","Small Dark Blue","Small Purple","Small Pink","Small Bright Pink","Small Brown","Small White","Small Light Gray","Small Gray","Small Black","Small Blue (Alternate)","Small Red (Alternate)"],[[],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[17],[18],[19],[20],[21],[22],[23]],[0],[0],[6,0],[20,0],[0],[0],[0],[6,0],[20,0],["0,0,12,20",""],["rect",""]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]},"\/0_to_99\/":{"f":[],"w":[],"h":[],"i":[]},"sites\/all\/libraries\/getlocations\/markers\/0_to_99\/":{"f":["shadow.png","blue_blank.png","blue_marker1.png","blue_marker2.png","blue_marker3.png","blue_marker4.png","blue_marker5.png","blue_marker6.png","blue_marker7.png","blue_marker8.png","blue_marker9.png","blue_marker10.png","blue_marker11.png","blue_marker12.png","blue_marker13.png","blue_marker14.png","blue_marker15.png","blue_marker16.png","blue_marker17.png","blue_marker18.png","blue_marker19.png","blue_marker20.png","blue_marker21.png","blue_marker22.png","blue_marker23.png","blue_marker24.png","blue_marker25.png","blue_marker26.png","blue_marker27.png","blue_marker28.png","blue_marker29.png","blue_marker30.png","blue_marker31.png","blue_marker32.png","blue_marker33.png","blue_marker34.png","blue_marker35.png","blue_marker36.png","blue_marker37.png","blue_marker38.png","blue_marker39.png","blue_marker40.png","blue_marker41.png","blue_marker42.png","blue_marker43.png","blue_marker44.png","blue_marker45.png","blue_marker46.png","blue_marker47.png","blue_marker48.png","blue_marker49.png","blue_marker50.png","blue_marker51.png","blue_marker52.png","blue_marker53.png","blue_marker54.png","blue_marker55.png","blue_marker56.png","blue_marker57.png","blue_marker58.png","blue_marker59.png","blue_marker60.png","blue_marker61.png","blue_marker62.png","blue_marker63.png","blue_marker64.png","blue_marker65.png","blue_marker66.png","blue_marker67.png","blue_marker68.png","blue_marker69.png","blue_marker70.png","blue_marker71.png","blue_marker72.png","blue_marker73.png","blue_marker74.png","blue_marker75.png","blue_marker76.png","blue_marker77.png","blue_marker78.png","blue_marker79.png","blue_marker80.png","blue_marker81.png","blue_marker82.png","blue_marker83.png","blue_marker84.png","blue_marker85.png","blue_marker86.png","blue_marker87.png","blue_marker88.png","blue_marker89.png","blue_marker90.png","blue_marker91.png","blue_marker92.png","blue_marker93.png","blue_marker94.png","blue_marker95.png","blue_marker96.png","blue_marker97.png","blue_marker98.png","blue_marker99.png","green_blank.png","green_marker1.png","green_marker2.png","green_marker3.png","green_marker4.png","green_marker5.png","green_marker6.png","green_marker7.png","green_marker8.png","green_marker9.png","green_marker10.png","green_marker11.png","green_marker12.png","green_marker13.png","green_marker14.png","green_marker15.png","green_marker16.png","green_marker17.png","green_marker18.png","green_marker19.png","green_marker20.png","green_marker21.png","green_marker22.png","green_marker23.png","green_marker24.png","green_marker25.png","green_marker26.png","green_marker27.png","green_marker28.png","green_marker29.png","green_marker30.png","green_marker31.png","green_marker32.png","green_marker33.png","green_marker34.png","green_marker35.png","green_marker36.png","green_marker37.png","green_marker38.png","green_marker39.png","green_marker40.png","green_marker41.png","green_marker42.png","green_marker43.png","green_marker44.png","green_marker45.png","green_marker46.png","green_marker47.png","green_marker48.png","green_marker49.png","green_marker50.png","green_marker51.png","green_marker52.png","green_marker53.png","green_marker54.png","green_marker55.png","green_marker56.png","green_marker57.png","green_marker58.png","green_marker59.png","green_marker60.png","green_marker61.png","green_marker62.png","green_marker63.png","green_marker64.png","green_marker65.png","green_marker66.png","green_marker67.png","green_marker68.png","green_marker69.png","green_marker70.png","green_marker71.png","green_marker72.png","green_marker73.png","green_marker74.png","green_marker75.png","green_marker76.png","green_marker77.png","green_marker78.png","green_marker79.png","green_marker80.png","green_marker81.png","green_marker82.png","green_marker83.png","green_marker84.png","green_marker85.png","green_marker86.png","green_marker87.png","green_marker88.png","green_marker89.png","green_marker90.png","green_marker91.png","green_marker92.png","green_marker93.png","green_marker94.png","green_marker95.png","green_marker96.png","green_marker97.png","green_marker98.png","green_marker99.png","largeTDBlue_blank.png","largeTDBlue_marker1.png","largeTDBlue_marker2.png","largeTDBlue_marker3.png","largeTDBlue_marker4.png","largeTDBlue_marker5.png","largeTDBlue_marker6.png","largeTDBlue_marker7.png","largeTDBlue_marker8.png","largeTDBlue_marker9.png","largeTDBlue_marker10.png","largeTDBlue_marker11.png","largeTDBlue_marker12.png","largeTDBlue_marker13.png","largeTDBlue_marker14.png","largeTDBlue_marker15.png","largeTDBlue_marker16.png","largeTDBlue_marker17.png","largeTDBlue_marker18.png","largeTDBlue_marker19.png","largeTDBlue_marker20.png","largeTDBlue_marker21.png","largeTDBlue_marker22.png","largeTDBlue_marker23.png","largeTDBlue_marker24.png","largeTDBlue_marker25.png","largeTDBlue_marker26.png","largeTDBlue_marker27.png","largeTDBlue_marker28.png","largeTDBlue_marker29.png","largeTDBlue_marker30.png","largeTDBlue_marker31.png","largeTDBlue_marker32.png","largeTDBlue_marker33.png","largeTDBlue_marker34.png","largeTDBlue_marker35.png","largeTDBlue_marker36.png","largeTDBlue_marker37.png","largeTDBlue_marker38.png","largeTDBlue_marker39.png","largeTDBlue_marker40.png","largeTDBlue_marker41.png","largeTDBlue_marker42.png","largeTDBlue_marker43.png","largeTDBlue_marker44.png","largeTDBlue_marker45.png","largeTDBlue_marker46.png","largeTDBlue_marker47.png","largeTDBlue_marker48.png","largeTDBlue_marker49.png","largeTDBlue_marker50.png","largeTDBlue_marker51.png","largeTDBlue_marker52.png","largeTDBlue_marker53.png","largeTDBlue_marker54.png","largeTDBlue_marker55.png","largeTDBlue_marker56.png","largeTDBlue_marker57.png","largeTDBlue_marker58.png","largeTDBlue_marker59.png","largeTDBlue_marker60.png","largeTDBlue_marker61.png","largeTDBlue_marker62.png","largeTDBlue_marker63.png","largeTDBlue_marker64.png","largeTDBlue_marker65.png","largeTDBlue_marker66.png","largeTDBlue_marker67.png","largeTDBlue_marker68.png","largeTDBlue_marker69.png","largeTDBlue_marker70.png","largeTDBlue_marker71.png","largeTDBlue_marker72.png","largeTDBlue_marker73.png","largeTDBlue_marker74.png","largeTDBlue_marker75.png","largeTDBlue_marker76.png","largeTDBlue_marker77.png","largeTDBlue_marker78.png","largeTDBlue_marker79.png","largeTDBlue_marker80.png","largeTDBlue_marker81.png","largeTDBlue_marker82.png","largeTDBlue_marker83.png","largeTDBlue_marker84.png","largeTDBlue_marker85.png","largeTDBlue_marker86.png","largeTDBlue_marker87.png","largeTDBlue_marker88.png","largeTDBlue_marker89.png","largeTDBlue_marker90.png","largeTDBlue_marker91.png","largeTDBlue_marker92.png","largeTDBlue_marker93.png","largeTDBlue_marker94.png","largeTDBlue_marker95.png","largeTDBlue_marker96.png","largeTDBlue_marker97.png","largeTDBlue_marker98.png","largeTDBlue_marker99.png","largeTDBlueRed_blank.png","largeTDBlueRed_marker1.png","largeTDBlueRed_marker2.png","largeTDBlueRed_marker3.png","largeTDBlueRed_marker4.png","largeTDBlueRed_marker5.png","largeTDBlueRed_marker6.png","largeTDBlueRed_marker7.png","largeTDBlueRed_marker8.png","largeTDBlueRed_marker9.png","largeTDBlueRed_marker10.png","largeTDBlueRed_marker11.png","largeTDBlueRed_marker12.png","largeTDBlueRed_marker13.png","largeTDBlueRed_marker14.png","largeTDBlueRed_marker15.png","largeTDBlueRed_marker16.png","largeTDBlueRed_marker17.png","largeTDBlueRed_marker18.png","largeTDBlueRed_marker19.png","largeTDBlueRed_marker20.png","largeTDBlueRed_marker21.png","largeTDBlueRed_marker22.png","largeTDBlueRed_marker23.png","largeTDBlueRed_marker24.png","largeTDBlueRed_marker25.png","largeTDBlueRed_marker26.png","largeTDBlueRed_marker27.png","largeTDBlueRed_marker28.png","largeTDBlueRed_marker29.png","largeTDBlueRed_marker30.png","largeTDBlueRed_marker31.png","largeTDBlueRed_marker32.png","largeTDBlueRed_marker33.png","largeTDBlueRed_marker34.png","largeTDBlueRed_marker35.png","largeTDBlueRed_marker36.png","largeTDBlueRed_marker37.png","largeTDBlueRed_marker38.png","largeTDBlueRed_marker39.png","largeTDBlueRed_marker40.png","largeTDBlueRed_marker41.png","largeTDBlueRed_marker42.png","largeTDBlueRed_marker43.png","largeTDBlueRed_marker44.png","largeTDBlueRed_marker45.png","largeTDBlueRed_marker46.png","largeTDBlueRed_marker47.png","largeTDBlueRed_marker48.png","largeTDBlueRed_marker49.png","largeTDBlueRed_marker50.png","largeTDBlueRed_marker51.png","largeTDBlueRed_marker52.png","largeTDBlueRed_marker53.png","largeTDBlueRed_marker54.png","largeTDBlueRed_marker55.png","largeTDBlueRed_marker56.png","largeTDBlueRed_marker57.png","largeTDBlueRed_marker58.png","largeTDBlueRed_marker59.png","largeTDBlueRed_marker60.png","largeTDBlueRed_marker61.png","largeTDBlueRed_marker62.png","largeTDBlueRed_marker63.png","largeTDBlueRed_marker64.png","largeTDBlueRed_marker65.png","largeTDBlueRed_marker66.png","largeTDBlueRed_marker67.png","largeTDBlueRed_marker68.png","largeTDBlueRed_marker69.png","largeTDBlueRed_marker70.png","largeTDBlueRed_marker71.png","largeTDBlueRed_marker72.png","largeTDBlueRed_marker73.png","largeTDBlueRed_marker74.png","largeTDBlueRed_marker75.png","largeTDBlueRed_marker76.png","largeTDBlueRed_marker77.png","largeTDBlueRed_marker78.png","largeTDBlueRed_marker79.png","largeTDBlueRed_marker80.png","largeTDBlueRed_marker81.png","largeTDBlueRed_marker82.png","largeTDBlueRed_marker83.png","largeTDBlueRed_marker84.png","largeTDBlueRed_marker85.png","largeTDBlueRed_marker86.png","largeTDBlueRed_marker87.png","largeTDBlueRed_marker88.png","largeTDBlueRed_marker89.png","largeTDBlueRed_marker90.png","largeTDBlueRed_marker91.png","largeTDBlueRed_marker92.png","largeTDBlueRed_marker93.png","largeTDBlueRed_marker94.png","largeTDBlueRed_marker95.png","largeTDBlueRed_marker96.png","largeTDBlueRed_marker97.png","largeTDBlueRed_marker98.png","largeTDBlueRed_marker99.png","largeTDGreen_blank.png","largeTDGreen_marker1.png","largeTDGreen_marker2.png","largeTDGreen_marker3.png","largeTDGreen_marker4.png","largeTDGreen_marker5.png","largeTDGreen_marker6.png","largeTDGreen_marker7.png","largeTDGreen_marker8.png","largeTDGreen_marker9.png","largeTDGreen_marker10.png","largeTDGreen_marker11.png","largeTDGreen_marker12.png","largeTDGreen_marker13.png","largeTDGreen_marker14.png","largeTDGreen_marker15.png","largeTDGreen_marker16.png","largeTDGreen_marker17.png","largeTDGreen_marker18.png","largeTDGreen_marker19.png","largeTDGreen_marker20.png","largeTDGreen_marker21.png","largeTDGreen_marker22.png","largeTDGreen_marker23.png","largeTDGreen_marker24.png","largeTDGreen_marker25.png","largeTDGreen_marker26.png","largeTDGreen_marker27.png","largeTDGreen_marker28.png","largeTDGreen_marker29.png","largeTDGreen_marker30.png","largeTDGreen_marker31.png","largeTDGreen_marker32.png","largeTDGreen_marker33.png","largeTDGreen_marker34.png","largeTDGreen_marker35.png","largeTDGreen_marker36.png","largeTDGreen_marker37.png","largeTDGreen_marker38.png","largeTDGreen_marker39.png","largeTDGreen_marker40.png","largeTDGreen_marker41.png","largeTDGreen_marker42.png","largeTDGreen_marker43.png","largeTDGreen_marker44.png","largeTDGreen_marker45.png","largeTDGreen_marker46.png","largeTDGreen_marker47.png","largeTDGreen_marker48.png","largeTDGreen_marker49.png","largeTDGreen_marker50.png","largeTDGreen_marker51.png","largeTDGreen_marker52.png","largeTDGreen_marker53.png","largeTDGreen_marker54.png","largeTDGreen_marker55.png","largeTDGreen_marker56.png","largeTDGreen_marker57.png","largeTDGreen_marker58.png","largeTDGreen_marker59.png","largeTDGreen_marker60.png","largeTDGreen_marker61.png","largeTDGreen_marker62.png","largeTDGreen_marker63.png","largeTDGreen_marker64.png","largeTDGreen_marker65.png","largeTDGreen_marker66.png","largeTDGreen_marker67.png","largeTDGreen_marker68.png","largeTDGreen_marker69.png","largeTDGreen_marker70.png","largeTDGreen_marker71.png","largeTDGreen_marker72.png","largeTDGreen_marker73.png","largeTDGreen_marker74.png","largeTDGreen_marker75.png","largeTDGreen_marker76.png","largeTDGreen_marker77.png","largeTDGreen_marker78.png","largeTDGreen_marker79.png","largeTDGreen_marker80.png","largeTDGreen_marker81.png","largeTDGreen_marker82.png","largeTDGreen_marker83.png","largeTDGreen_marker84.png","largeTDGreen_marker85.png","largeTDGreen_marker86.png","largeTDGreen_marker87.png","largeTDGreen_marker88.png","largeTDGreen_marker89.png","largeTDGreen_marker90.png","largeTDGreen_marker91.png","largeTDGreen_marker92.png","largeTDGreen_marker93.png","largeTDGreen_marker94.png","largeTDGreen_marker95.png","largeTDGreen_marker96.png","largeTDGreen_marker97.png","largeTDGreen_marker98.png","largeTDGreen_marker99.png","largeTDGreenRed_blank.png","largeTDGreenRed_marker1.png","largeTDGreenRed_marker2.png","largeTDGreenRed_marker3.png","largeTDGreenRed_marker4.png","largeTDGreenRed_marker5.png","largeTDGreenRed_marker6.png","largeTDGreenRed_marker7.png","largeTDGreenRed_marker8.png","largeTDGreenRed_marker9.png","largeTDGreenRed_marker10.png","largeTDGreenRed_marker11.png","largeTDGreenRed_marker12.png","largeTDGreenRed_marker13.png","largeTDGreenRed_marker14.png","largeTDGreenRed_marker15.png","largeTDGreenRed_marker16.png","largeTDGreenRed_marker17.png","largeTDGreenRed_marker18.png","largeTDGreenRed_marker19.png","largeTDGreenRed_marker20.png","largeTDGreenRed_marker21.png","largeTDGreenRed_marker22.png","largeTDGreenRed_marker23.png","largeTDGreenRed_marker24.png","largeTDGreenRed_marker25.png","largeTDGreenRed_marker26.png","largeTDGreenRed_marker27.png","largeTDGreenRed_marker28.png","largeTDGreenRed_marker29.png","largeTDGreenRed_marker30.png","largeTDGreenRed_marker31.png","largeTDGreenRed_marker32.png","largeTDGreenRed_marker33.png","largeTDGreenRed_marker34.png","largeTDGreenRed_marker35.png","largeTDGreenRed_marker36.png","largeTDGreenRed_marker37.png","largeTDGreenRed_marker38.png","largeTDGreenRed_marker39.png","largeTDGreenRed_marker40.png","largeTDGreenRed_marker41.png","largeTDGreenRed_marker42.png","largeTDGreenRed_marker43.png","largeTDGreenRed_marker44.png","largeTDGreenRed_marker45.png","largeTDGreenRed_marker46.png","largeTDGreenRed_marker47.png","largeTDGreenRed_marker48.png","largeTDGreenRed_marker49.png","largeTDGreenRed_marker50.png","largeTDGreenRed_marker51.png","largeTDGreenRed_marker52.png","largeTDGreenRed_marker53.png","largeTDGreenRed_marker54.png","largeTDGreenRed_marker55.png","largeTDGreenRed_marker56.png","largeTDGreenRed_marker57.png","largeTDGreenRed_marker58.png","largeTDGreenRed_marker59.png","largeTDGreenRed_marker60.png","largeTDGreenRed_marker61.png","largeTDGreenRed_marker62.png","largeTDGreenRed_marker63.png","largeTDGreenRed_marker64.png","largeTDGreenRed_marker65.png","largeTDGreenRed_marker66.png","largeTDGreenRed_marker67.png","largeTDGreenRed_marker68.png","largeTDGreenRed_marker69.png","largeTDGreenRed_marker70.png","largeTDGreenRed_marker71.png","largeTDGreenRed_marker72.png","largeTDGreenRed_marker73.png","largeTDGreenRed_marker74.png","largeTDGreenRed_marker75.png","largeTDGreenRed_marker76.png","largeTDGreenRed_marker77.png","largeTDGreenRed_marker78.png","largeTDGreenRed_marker79.png","largeTDGreenRed_marker80.png","largeTDGreenRed_marker81.png","largeTDGreenRed_marker82.png","largeTDGreenRed_marker83.png","largeTDGreenRed_marker84.png","largeTDGreenRed_marker85.png","largeTDGreenRed_marker86.png","largeTDGreenRed_marker87.png","largeTDGreenRed_marker88.png","largeTDGreenRed_marker89.png","largeTDGreenRed_marker90.png","largeTDGreenRed_marker91.png","largeTDGreenRed_marker92.png","largeTDGreenRed_marker93.png","largeTDGreenRed_marker94.png","largeTDGreenRed_marker95.png","largeTDGreenRed_marker96.png","largeTDGreenRed_marker97.png","largeTDGreenRed_marker98.png","largeTDGreenRed_marker99.png","largeTDRed_blank.png","largeTDRed_marker1.png","largeTDRed_marker2.png","largeTDRed_marker3.png","largeTDRed_marker4.png","largeTDRed_marker5.png","largeTDRed_marker6.png","largeTDRed_marker7.png","largeTDRed_marker8.png","largeTDRed_marker9.png","largeTDRed_marker10.png","largeTDRed_marker11.png","largeTDRed_marker12.png","largeTDRed_marker13.png","largeTDRed_marker14.png","largeTDRed_marker15.png","largeTDRed_marker16.png","largeTDRed_marker17.png","largeTDRed_marker18.png","largeTDRed_marker19.png","largeTDRed_marker20.png","largeTDRed_marker21.png","largeTDRed_marker22.png","largeTDRed_marker23.png","largeTDRed_marker24.png","largeTDRed_marker25.png","largeTDRed_marker26.png","largeTDRed_marker27.png","largeTDRed_marker28.png","largeTDRed_marker29.png","largeTDRed_marker30.png","largeTDRed_marker31.png","largeTDRed_marker32.png","largeTDRed_marker33.png","largeTDRed_marker34.png","largeTDRed_marker35.png","largeTDRed_marker36.png","largeTDRed_marker37.png","largeTDRed_marker38.png","largeTDRed_marker39.png","largeTDRed_marker40.png","largeTDRed_marker41.png","largeTDRed_marker42.png","largeTDRed_marker43.png","largeTDRed_marker44.png","largeTDRed_marker45.png","largeTDRed_marker46.png","largeTDRed_marker47.png","largeTDRed_marker48.png","largeTDRed_marker49.png","largeTDRed_marker50.png","largeTDRed_marker51.png","largeTDRed_marker52.png","largeTDRed_marker53.png","largeTDRed_marker54.png","largeTDRed_marker55.png","largeTDRed_marker56.png","largeTDRed_marker57.png","largeTDRed_marker58.png","largeTDRed_marker59.png","largeTDRed_marker60.png","largeTDRed_marker61.png","largeTDRed_marker62.png","largeTDRed_marker63.png","largeTDRed_marker64.png","largeTDRed_marker65.png","largeTDRed_marker66.png","largeTDRed_marker67.png","largeTDRed_marker68.png","largeTDRed_marker69.png","largeTDRed_marker70.png","largeTDRed_marker71.png","largeTDRed_marker72.png","largeTDRed_marker73.png","largeTDRed_marker74.png","largeTDRed_marker75.png","largeTDRed_marker76.png","largeTDRed_marker77.png","largeTDRed_marker78.png","largeTDRed_marker79.png","largeTDRed_marker80.png","largeTDRed_marker81.png","largeTDRed_marker82.png","largeTDRed_marker83.png","largeTDRed_marker84.png","largeTDRed_marker85.png","largeTDRed_marker86.png","largeTDRed_marker87.png","largeTDRed_marker88.png","largeTDRed_marker89.png","largeTDRed_marker90.png","largeTDRed_marker91.png","largeTDRed_marker92.png","largeTDRed_marker93.png","largeTDRed_marker94.png","largeTDRed_marker95.png","largeTDRed_marker96.png","largeTDRed_marker97.png","largeTDRed_marker98.png","largeTDRed_marker99.png","largeTDYellow_blank.png","largeTDYellow_marker1.png","largeTDYellow_marker2.png","largeTDYellow_marker3.png","largeTDYellow_marker4.png","largeTDYellow_marker5.png","largeTDYellow_marker6.png","largeTDYellow_marker7.png","largeTDYellow_marker8.png","largeTDYellow_marker9.png","largeTDYellow_marker10.png","largeTDYellow_marker11.png","largeTDYellow_marker12.png","largeTDYellow_marker13.png","largeTDYellow_marker14.png","largeTDYellow_marker15.png","largeTDYellow_marker16.png","largeTDYellow_marker17.png","largeTDYellow_marker18.png","largeTDYellow_marker19.png","largeTDYellow_marker20.png","largeTDYellow_marker21.png","largeTDYellow_marker22.png","largeTDYellow_marker23.png","largeTDYellow_marker24.png","largeTDYellow_marker25.png","largeTDYellow_marker26.png","largeTDYellow_marker27.png","largeTDYellow_marker28.png","largeTDYellow_marker29.png","largeTDYellow_marker30.png","largeTDYellow_marker31.png","largeTDYellow_marker32.png","largeTDYellow_marker33.png","largeTDYellow_marker34.png","largeTDYellow_marker35.png","largeTDYellow_marker36.png","largeTDYellow_marker37.png","largeTDYellow_marker38.png","largeTDYellow_marker39.png","largeTDYellow_marker40.png","largeTDYellow_marker41.png","largeTDYellow_marker42.png","largeTDYellow_marker43.png","largeTDYellow_marker44.png","largeTDYellow_marker45.png","largeTDYellow_marker46.png","largeTDYellow_marker47.png","largeTDYellow_marker48.png","largeTDYellow_marker49.png","largeTDYellow_marker50.png","largeTDYellow_marker51.png","largeTDYellow_marker52.png","largeTDYellow_marker53.png","largeTDYellow_marker54.png","largeTDYellow_marker55.png","largeTDYellow_marker56.png","largeTDYellow_marker57.png","largeTDYellow_marker58.png","largeTDYellow_marker59.png","largeTDYellow_marker60.png","largeTDYellow_marker61.png","largeTDYellow_marker62.png","largeTDYellow_marker63.png","largeTDYellow_marker64.png","largeTDYellow_marker65.png","largeTDYellow_marker66.png","largeTDYellow_marker67.png","largeTDYellow_marker68.png","largeTDYellow_marker69.png","largeTDYellow_marker70.png","largeTDYellow_marker71.png","largeTDYellow_marker72.png","largeTDYellow_marker73.png","largeTDYellow_marker74.png","largeTDYellow_marker75.png","largeTDYellow_marker76.png","largeTDYellow_marker77.png","largeTDYellow_marker78.png","largeTDYellow_marker79.png","largeTDYellow_marker80.png","largeTDYellow_marker81.png","largeTDYellow_marker82.png","largeTDYellow_marker83.png","largeTDYellow_marker84.png","largeTDYellow_marker85.png","largeTDYellow_marker86.png","largeTDYellow_marker87.png","largeTDYellow_marker88.png","largeTDYellow_marker89.png","largeTDYellow_marker90.png","largeTDYellow_marker91.png","largeTDYellow_marker92.png","largeTDYellow_marker93.png","largeTDYellow_marker94.png","largeTDYellow_marker95.png","largeTDYellow_marker96.png","largeTDYellow_marker97.png","largeTDYellow_marker98.png","largeTDYellow_marker99.png","orange_blank.png","orange_marker1.png","orange_marker2.png","orange_marker3.png","orange_marker4.png","orange_marker5.png","orange_marker6.png","orange_marker7.png","orange_marker8.png","orange_marker9.png","orange_marker10.png","orange_marker11.png","orange_marker12.png","orange_marker13.png","orange_marker14.png","orange_marker15.png","orange_marker16.png","orange_marker17.png","orange_marker18.png","orange_marker19.png","orange_marker20.png","orange_marker21.png","orange_marker22.png","orange_marker23.png","orange_marker24.png","orange_marker25.png","orange_marker26.png","orange_marker27.png","orange_marker28.png","orange_marker29.png","orange_marker30.png","orange_marker31.png","orange_marker32.png","orange_marker33.png","orange_marker34.png","orange_marker35.png","orange_marker36.png","orange_marker37.png","orange_marker38.png","orange_marker39.png","orange_marker40.png","orange_marker41.png","orange_marker42.png","orange_marker43.png","orange_marker44.png","orange_marker45.png","orange_marker46.png","orange_marker47.png","orange_marker48.png","orange_marker49.png","orange_marker50.png","orange_marker51.png","orange_marker52.png","orange_marker53.png","orange_marker54.png","orange_marker55.png","orange_marker56.png","orange_marker57.png","orange_marker58.png","orange_marker59.png","orange_marker60.png","orange_marker61.png","orange_marker62.png","orange_marker63.png","orange_marker64.png","orange_marker65.png","orange_marker66.png","orange_marker67.png","orange_marker68.png","orange_marker69.png","orange_marker70.png","orange_marker71.png","orange_marker72.png","orange_marker73.png","orange_marker74.png","orange_marker75.png","orange_marker76.png","orange_marker77.png","orange_marker78.png","orange_marker79.png","orange_marker80.png","orange_marker81.png","orange_marker82.png","orange_marker83.png","orange_marker84.png","orange_marker85.png","orange_marker86.png","orange_marker87.png","orange_marker88.png","orange_marker89.png","orange_marker90.png","orange_marker91.png","orange_marker92.png","orange_marker93.png","orange_marker94.png","orange_marker95.png","orange_marker96.png","orange_marker97.png","orange_marker98.png","orange_marker99.png","pink_blank.png","pink_marker1.png","pink_marker2.png","pink_marker3.png","pink_marker4.png","pink_marker5.png","pink_marker6.png","pink_marker7.png","pink_marker8.png","pink_marker9.png","pink_marker10.png","pink_marker11.png","pink_marker12.png","pink_marker13.png","pink_marker14.png","pink_marker15.png","pink_marker16.png","pink_marker17.png","pink_marker18.png","pink_marker19.png","pink_marker20.png","pink_marker21.png","pink_marker22.png","pink_marker23.png","pink_marker24.png","pink_marker25.png","pink_marker26.png","pink_marker27.png","pink_marker28.png","pink_marker29.png","pink_marker30.png","pink_marker31.png","pink_marker32.png","pink_marker33.png","pink_marker34.png","pink_marker35.png","pink_marker36.png","pink_marker37.png","pink_marker38.png","pink_marker39.png","pink_marker40.png","pink_marker41.png","pink_marker42.png","pink_marker43.png","pink_marker44.png","pink_marker45.png","pink_marker46.png","pink_marker47.png","pink_marker48.png","pink_marker49.png","pink_marker50.png","pink_marker51.png","pink_marker52.png","pink_marker53.png","pink_marker54.png","pink_marker55.png","pink_marker56.png","pink_marker57.png","pink_marker58.png","pink_marker59.png","pink_marker60.png","pink_marker61.png","pink_marker62.png","pink_marker63.png","pink_marker64.png","pink_marker65.png","pink_marker66.png","pink_marker67.png","pink_marker68.png","pink_marker69.png","pink_marker70.png","pink_marker71.png","pink_marker72.png","pink_marker73.png","pink_marker74.png","pink_marker75.png","pink_marker76.png","pink_marker77.png","pink_marker78.png","pink_marker79.png","pink_marker80.png","pink_marker81.png","pink_marker82.png","pink_marker83.png","pink_marker84.png","pink_marker85.png","pink_marker86.png","pink_marker87.png","pink_marker88.png","pink_marker89.png","pink_marker90.png","pink_marker91.png","pink_marker92.png","pink_marker93.png","pink_marker94.png","pink_marker95.png","pink_marker96.png","pink_marker97.png","pink_marker98.png","pink_marker99.png","red_blank.png","red_marker1.png","red_marker2.png","red_marker3.png","red_marker4.png","red_marker5.png","red_marker6.png","red_marker7.png","red_marker8.png","red_marker9.png","red_marker10.png","red_marker11.png","red_marker12.png","red_marker13.png","red_marker14.png","red_marker15.png","red_marker16.png","red_marker17.png","red_marker18.png","red_marker19.png","red_marker20.png","red_marker21.png","red_marker22.png","red_marker23.png","red_marker24.png","red_marker25.png","red_marker26.png","red_marker27.png","red_marker28.png","red_marker29.png","red_marker30.png","red_marker31.png","red_marker32.png","red_marker33.png","red_marker34.png","red_marker35.png","red_marker36.png","red_marker37.png","red_marker38.png","red_marker39.png","red_marker40.png","red_marker41.png","red_marker42.png","red_marker43.png","red_marker44.png","red_marker45.png","red_marker46.png","red_marker47.png","red_marker48.png","red_marker49.png","red_marker50.png","red_marker51.png","red_marker52.png","red_marker53.png","red_marker54.png","red_marker55.png","red_marker56.png","red_marker57.png","red_marker58.png","red_marker59.png","red_marker60.png","red_marker61.png","red_marker62.png","red_marker63.png","red_marker64.png","red_marker65.png","red_marker66.png","red_marker67.png","red_marker68.png","red_marker69.png","red_marker70.png","red_marker71.png","red_marker72.png","red_marker73.png","red_marker74.png","red_marker75.png","red_marker76.png","red_marker77.png","red_marker78.png","red_marker79.png","red_marker80.png","red_marker81.png","red_marker82.png","red_marker83.png","red_marker84.png","red_marker85.png","red_marker86.png","red_marker87.png","red_marker88.png","red_marker89.png","red_marker90.png","red_marker91.png","red_marker92.png","red_marker93.png","red_marker94.png","red_marker95.png","red_marker96.png","red_marker97.png","red_marker98.png","red_marker99.png"],"w":[40,20],"h":[34],"i":[[[["defaults","0_to_99 blue blank","0_to_99 blue 1","0_to_99 blue 2","0_to_99 blue 3","0_to_99 blue 4","0_to_99 blue 5","0_to_99 blue 6","0_to_99 blue 7","0_to_99 blue 8","0_to_99 blue 9","0_to_99 blue 10","0_to_99 blue 11","0_to_99 blue 12","0_to_99 blue 13","0_to_99 blue 14","0_to_99 blue 15","0_to_99 blue 16","0_to_99 blue 17","0_to_99 blue 18","0_to_99 blue 19","0_to_99 blue 20","0_to_99 blue 21","0_to_99 blue 22","0_to_99 blue 23","0_to_99 blue 24","0_to_99 blue 25","0_to_99 blue 26","0_to_99 blue 27","0_to_99 blue 28","0_to_99 blue 29","0_to_99 blue 30","0_to_99 blue 31","0_to_99 blue 32","0_to_99 blue 33","0_to_99 blue 34","0_to_99 blue 35","0_to_99 blue 36","0_to_99 blue 37","0_to_99 blue 38","0_to_99 blue 39","0_to_99 blue 40","0_to_99 blue 41","0_to_99 blue 42","0_to_99 blue 43","0_to_99 blue 44","0_to_99 blue 45","0_to_99 blue 46","0_to_99 blue 47","0_to_99 blue 48","0_to_99 blue 49","0_to_99 blue 50","0_to_99 blue 51","0_to_99 blue 52","0_to_99 blue 53","0_to_99 blue 54","0_to_99 blue 55","0_to_99 blue 56","0_to_99 blue 57","0_to_99 blue 58","0_to_99 blue 59","0_to_99 blue 60","0_to_99 blue 61","0_to_99 blue 62","0_to_99 blue 63","0_to_99 blue 64","0_to_99 blue 65","0_to_99 blue 66","0_to_99 blue 67","0_to_99 blue 68","0_to_99 blue 69","0_to_99 blue 70","0_to_99 blue 71","0_to_99 blue 72","0_to_99 blue 73","0_to_99 blue 74","0_to_99 blue 75","0_to_99 blue 76","0_to_99 blue 77","0_to_99 blue 78","0_to_99 blue 79","0_to_99 blue 80","0_to_99 blue 81","0_to_99 blue 82","0_to_99 blue 83","0_to_99 blue 84","0_to_99 blue 85","0_to_99 blue 86","0_to_99 blue 87","0_to_99 blue 88","0_to_99 blue 89","0_to_99 blue 90","0_to_99 blue 91","0_to_99 blue 92","0_to_99 blue 93","0_to_99 blue 94","0_to_99 blue 95","0_to_99 blue 96","0_to_99 blue 97","0_to_99 blue 98","0_to_99 blue 99","0_to_99 green blank","0_to_99 green 1","0_to_99 green 2","0_to_99 green 3","0_to_99 green 4","0_to_99 green 5","0_to_99 green 6","0_to_99 green 7","0_to_99 green 8","0_to_99 green 9","0_to_99 green 10","0_to_99 green 11","0_to_99 green 12","0_to_99 green 13","0_to_99 green 14","0_to_99 green 15","0_to_99 green 16","0_to_99 green 17","0_to_99 green 18","0_to_99 green 19","0_to_99 green 20","0_to_99 green 21","0_to_99 green 22","0_to_99 green 23","0_to_99 green 24","0_to_99 green 25","0_to_99 green 26","0_to_99 green 27","0_to_99 green 28","0_to_99 green 29","0_to_99 green 30","0_to_99 green 31","0_to_99 green 32","0_to_99 green 33","0_to_99 green 34","0_to_99 green 35","0_to_99 green 36","0_to_99 green 37","0_to_99 green 38","0_to_99 green 39","0_to_99 green 40","0_to_99 green 41","0_to_99 green 42","0_to_99 green 43","0_to_99 green 44","0_to_99 green 45","0_to_99 green 46","0_to_99 green 47","0_to_99 green 48","0_to_99 green 49","0_to_99 green 50","0_to_99 green 51","0_to_99 green 52","0_to_99 green 53","0_to_99 green 54","0_to_99 green 55","0_to_99 green 56","0_to_99 green 57","0_to_99 green 58","0_to_99 green 59","0_to_99 green 60","0_to_99 green 61","0_to_99 green 62","0_to_99 green 63","0_to_99 green 64","0_to_99 green 65","0_to_99 green 66","0_to_99 green 67","0_to_99 green 68","0_to_99 green 69","0_to_99 green 70","0_to_99 green 71","0_to_99 green 72","0_to_99 green 73","0_to_99 green 74","0_to_99 green 75","0_to_99 green 76","0_to_99 green 77","0_to_99 green 78","0_to_99 green 79","0_to_99 green 80","0_to_99 green 81","0_to_99 green 82","0_to_99 green 83","0_to_99 green 84","0_to_99 green 85","0_to_99 green 86","0_to_99 green 87","0_to_99 green 88","0_to_99 green 89","0_to_99 green 90","0_to_99 green 91","0_to_99 green 92","0_to_99 green 93","0_to_99 green 94","0_to_99 green 95","0_to_99 green 96","0_to_99 green 97","0_to_99 green 98","0_to_99 green 99","0_to_99 largeTDBlue blank","0_to_99 largeTDBlue 1","0_to_99 largeTDBlue 2","0_to_99 largeTDBlue 3","0_to_99 largeTDBlue 4","0_to_99 largeTDBlue 5","0_to_99 largeTDBlue 6","0_to_99 largeTDBlue 7","0_to_99 largeTDBlue 8","0_to_99 largeTDBlue 9","0_to_99 largeTDBlue 10","0_to_99 largeTDBlue 11","0_to_99 largeTDBlue 12","0_to_99 largeTDBlue 13","0_to_99 largeTDBlue 14","0_to_99 largeTDBlue 15","0_to_99 largeTDBlue 16","0_to_99 largeTDBlue 17","0_to_99 largeTDBlue 18","0_to_99 largeTDBlue 19","0_to_99 largeTDBlue 20","0_to_99 largeTDBlue 21","0_to_99 largeTDBlue 22","0_to_99 largeTDBlue 23","0_to_99 largeTDBlue 24","0_to_99 largeTDBlue 25","0_to_99 largeTDBlue 26","0_to_99 largeTDBlue 27","0_to_99 largeTDBlue 28","0_to_99 largeTDBlue 29","0_to_99 largeTDBlue 30","0_to_99 largeTDBlue 31","0_to_99 largeTDBlue 32","0_to_99 largeTDBlue 33","0_to_99 largeTDBlue 34","0_to_99 largeTDBlue 35","0_to_99 largeTDBlue 36","0_to_99 largeTDBlue 37","0_to_99 largeTDBlue 38","0_to_99 largeTDBlue 39","0_to_99 largeTDBlue 40","0_to_99 largeTDBlue 41","0_to_99 largeTDBlue 42","0_to_99 largeTDBlue 43","0_to_99 largeTDBlue 44","0_to_99 largeTDBlue 45","0_to_99 largeTDBlue 46","0_to_99 largeTDBlue 47","0_to_99 largeTDBlue 48","0_to_99 largeTDBlue 49","0_to_99 largeTDBlue 50","0_to_99 largeTDBlue 51","0_to_99 largeTDBlue 52","0_to_99 largeTDBlue 53","0_to_99 largeTDBlue 54","0_to_99 largeTDBlue 55","0_to_99 largeTDBlue 56","0_to_99 largeTDBlue 57","0_to_99 largeTDBlue 58","0_to_99 largeTDBlue 59","0_to_99 largeTDBlue 60","0_to_99 largeTDBlue 61","0_to_99 largeTDBlue 62","0_to_99 largeTDBlue 63","0_to_99 largeTDBlue 64","0_to_99 largeTDBlue 65","0_to_99 largeTDBlue 66","0_to_99 largeTDBlue 67","0_to_99 largeTDBlue 68","0_to_99 largeTDBlue 69","0_to_99 largeTDBlue 70","0_to_99 largeTDBlue 71","0_to_99 largeTDBlue 72","0_to_99 largeTDBlue 73","0_to_99 largeTDBlue 74","0_to_99 largeTDBlue 75","0_to_99 largeTDBlue 76","0_to_99 largeTDBlue 77","0_to_99 largeTDBlue 78","0_to_99 largeTDBlue 79","0_to_99 largeTDBlue 80","0_to_99 largeTDBlue 81","0_to_99 largeTDBlue 82","0_to_99 largeTDBlue 83","0_to_99 largeTDBlue 84","0_to_99 largeTDBlue 85","0_to_99 largeTDBlue 86","0_to_99 largeTDBlue 87","0_to_99 largeTDBlue 88","0_to_99 largeTDBlue 89","0_to_99 largeTDBlue 90","0_to_99 largeTDBlue 91","0_to_99 largeTDBlue 92","0_to_99 largeTDBlue 93","0_to_99 largeTDBlue 94","0_to_99 largeTDBlue 95","0_to_99 largeTDBlue 96","0_to_99 largeTDBlue 97","0_to_99 largeTDBlue 98","0_to_99 largeTDBlue 99","0_to_99 largeTDBlueRed blank","0_to_99 largeTDBlueRed 1","0_to_99 largeTDBlueRed 2","0_to_99 largeTDBlueRed 3","0_to_99 largeTDBlueRed 4","0_to_99 largeTDBlueRed 5","0_to_99 largeTDBlueRed 6","0_to_99 largeTDBlueRed 7","0_to_99 largeTDBlueRed 8","0_to_99 largeTDBlueRed 9","0_to_99 largeTDBlueRed 10","0_to_99 largeTDBlueRed 11","0_to_99 largeTDBlueRed 12","0_to_99 largeTDBlueRed 13","0_to_99 largeTDBlueRed 14","0_to_99 largeTDBlueRed 15","0_to_99 largeTDBlueRed 16","0_to_99 largeTDBlueRed 17","0_to_99 largeTDBlueRed 18","0_to_99 largeTDBlueRed 19","0_to_99 largeTDBlueRed 20","0_to_99 largeTDBlueRed 21","0_to_99 largeTDBlueRed 22","0_to_99 largeTDBlueRed 23","0_to_99 largeTDBlueRed 24","0_to_99 largeTDBlueRed 25","0_to_99 largeTDBlueRed 26","0_to_99 largeTDBlueRed 27","0_to_99 largeTDBlueRed 28","0_to_99 largeTDBlueRed 29","0_to_99 largeTDBlueRed 30","0_to_99 largeTDBlueRed 31","0_to_99 largeTDBlueRed 32","0_to_99 largeTDBlueRed 33","0_to_99 largeTDBlueRed 34","0_to_99 largeTDBlueRed 35","0_to_99 largeTDBlueRed 36","0_to_99 largeTDBlueRed 37","0_to_99 largeTDBlueRed 38","0_to_99 largeTDBlueRed 39","0_to_99 largeTDBlueRed 40","0_to_99 largeTDBlueRed 41","0_to_99 largeTDBlueRed 42","0_to_99 largeTDBlueRed 43","0_to_99 largeTDBlueRed 44","0_to_99 largeTDBlueRed 45","0_to_99 largeTDBlueRed 46","0_to_99 largeTDBlueRed 47","0_to_99 largeTDBlueRed 48","0_to_99 largeTDBlueRed 49","0_to_99 largeTDBlueRed 50","0_to_99 largeTDBlueRed 51","0_to_99 largeTDBlueRed 52","0_to_99 largeTDBlueRed 53","0_to_99 largeTDBlueRed 54","0_to_99 largeTDBlueRed 55","0_to_99 largeTDBlueRed 56","0_to_99 largeTDBlueRed 57","0_to_99 largeTDBlueRed 58","0_to_99 largeTDBlueRed 59","0_to_99 largeTDBlueRed 60","0_to_99 largeTDBlueRed 61","0_to_99 largeTDBlueRed 62","0_to_99 largeTDBlueRed 63","0_to_99 largeTDBlueRed 64","0_to_99 largeTDBlueRed 65","0_to_99 largeTDBlueRed 66","0_to_99 largeTDBlueRed 67","0_to_99 largeTDBlueRed 68","0_to_99 largeTDBlueRed 69","0_to_99 largeTDBlueRed 70","0_to_99 largeTDBlueRed 71","0_to_99 largeTDBlueRed 72","0_to_99 largeTDBlueRed 73","0_to_99 largeTDBlueRed 74","0_to_99 largeTDBlueRed 75","0_to_99 largeTDBlueRed 76","0_to_99 largeTDBlueRed 77","0_to_99 largeTDBlueRed 78","0_to_99 largeTDBlueRed 79","0_to_99 largeTDBlueRed 80","0_to_99 largeTDBlueRed 81","0_to_99 largeTDBlueRed 82","0_to_99 largeTDBlueRed 83","0_to_99 largeTDBlueRed 84","0_to_99 largeTDBlueRed 85","0_to_99 largeTDBlueRed 86","0_to_99 largeTDBlueRed 87","0_to_99 largeTDBlueRed 88","0_to_99 largeTDBlueRed 89","0_to_99 largeTDBlueRed 90","0_to_99 largeTDBlueRed 91","0_to_99 largeTDBlueRed 92","0_to_99 largeTDBlueRed 93","0_to_99 largeTDBlueRed 94","0_to_99 largeTDBlueRed 95","0_to_99 largeTDBlueRed 96","0_to_99 largeTDBlueRed 97","0_to_99 largeTDBlueRed 98","0_to_99 largeTDBlueRed 99","0_to_99 largeTDGreen blank","0_to_99 largeTDGreen 1","0_to_99 largeTDGreen 2","0_to_99 largeTDGreen 3","0_to_99 largeTDGreen 4","0_to_99 largeTDGreen 5","0_to_99 largeTDGreen 6","0_to_99 largeTDGreen 7","0_to_99 largeTDGreen 8","0_to_99 largeTDGreen 9","0_to_99 largeTDGreen 10","0_to_99 largeTDGreen 11","0_to_99 largeTDGreen 12","0_to_99 largeTDGreen 13","0_to_99 largeTDGreen 14","0_to_99 largeTDGreen 15","0_to_99 largeTDGreen 16","0_to_99 largeTDGreen 17","0_to_99 largeTDGreen 18","0_to_99 largeTDGreen 19","0_to_99 largeTDGreen 20","0_to_99 largeTDGreen 21","0_to_99 largeTDGreen 22","0_to_99 largeTDGreen 23","0_to_99 largeTDGreen 24","0_to_99 largeTDGreen 25","0_to_99 largeTDGreen 26","0_to_99 largeTDGreen 27","0_to_99 largeTDGreen 28","0_to_99 largeTDGreen 29","0_to_99 largeTDGreen 30","0_to_99 largeTDGreen 31","0_to_99 largeTDGreen 32","0_to_99 largeTDGreen 33","0_to_99 largeTDGreen 34","0_to_99 largeTDGreen 35","0_to_99 largeTDGreen 36","0_to_99 largeTDGreen 37","0_to_99 largeTDGreen 38","0_to_99 largeTDGreen 39","0_to_99 largeTDGreen 40","0_to_99 largeTDGreen 41","0_to_99 largeTDGreen 42","0_to_99 largeTDGreen 43","0_to_99 largeTDGreen 44","0_to_99 largeTDGreen 45","0_to_99 largeTDGreen 46","0_to_99 largeTDGreen 47","0_to_99 largeTDGreen 48","0_to_99 largeTDGreen 49","0_to_99 largeTDGreen 50","0_to_99 largeTDGreen 51","0_to_99 largeTDGreen 52","0_to_99 largeTDGreen 53","0_to_99 largeTDGreen 54","0_to_99 largeTDGreen 55","0_to_99 largeTDGreen 56","0_to_99 largeTDGreen 57","0_to_99 largeTDGreen 58","0_to_99 largeTDGreen 59","0_to_99 largeTDGreen 60","0_to_99 largeTDGreen 61","0_to_99 largeTDGreen 62","0_to_99 largeTDGreen 63","0_to_99 largeTDGreen 64","0_to_99 largeTDGreen 65","0_to_99 largeTDGreen 66","0_to_99 largeTDGreen 67","0_to_99 largeTDGreen 68","0_to_99 largeTDGreen 69","0_to_99 largeTDGreen 70","0_to_99 largeTDGreen 71","0_to_99 largeTDGreen 72","0_to_99 largeTDGreen 73","0_to_99 largeTDGreen 74","0_to_99 largeTDGreen 75","0_to_99 largeTDGreen 76","0_to_99 largeTDGreen 77","0_to_99 largeTDGreen 78","0_to_99 largeTDGreen 79","0_to_99 largeTDGreen 80","0_to_99 largeTDGreen 81","0_to_99 largeTDGreen 82","0_to_99 largeTDGreen 83","0_to_99 largeTDGreen 84","0_to_99 largeTDGreen 85","0_to_99 largeTDGreen 86","0_to_99 largeTDGreen 87","0_to_99 largeTDGreen 88","0_to_99 largeTDGreen 89","0_to_99 largeTDGreen 90","0_to_99 largeTDGreen 91","0_to_99 largeTDGreen 92","0_to_99 largeTDGreen 93","0_to_99 largeTDGreen 94","0_to_99 largeTDGreen 95","0_to_99 largeTDGreen 96","0_to_99 largeTDGreen 97","0_to_99 largeTDGreen 98","0_to_99 largeTDGreen 99","0_to_99 largeTDGreenRed blank","0_to_99 largeTDGreenRed 1","0_to_99 largeTDGreenRed 2","0_to_99 largeTDGreenRed 3","0_to_99 largeTDGreenRed 4","0_to_99 largeTDGreenRed 5","0_to_99 largeTDGreenRed 6","0_to_99 largeTDGreenRed 7","0_to_99 largeTDGreenRed 8","0_to_99 largeTDGreenRed 9","0_to_99 largeTDGreenRed 10","0_to_99 largeTDGreenRed 11","0_to_99 largeTDGreenRed 12","0_to_99 largeTDGreenRed 13","0_to_99 largeTDGreenRed 14","0_to_99 largeTDGreenRed 15","0_to_99 largeTDGreenRed 16","0_to_99 largeTDGreenRed 17","0_to_99 largeTDGreenRed 18","0_to_99 largeTDGreenRed 19","0_to_99 largeTDGreenRed 20","0_to_99 largeTDGreenRed 21","0_to_99 largeTDGreenRed 22","0_to_99 largeTDGreenRed 23","0_to_99 largeTDGreenRed 24","0_to_99 largeTDGreenRed 25","0_to_99 largeTDGreenRed 26","0_to_99 largeTDGreenRed 27","0_to_99 largeTDGreenRed 28","0_to_99 largeTDGreenRed 29","0_to_99 largeTDGreenRed 30","0_to_99 largeTDGreenRed 31","0_to_99 largeTDGreenRed 32","0_to_99 largeTDGreenRed 33","0_to_99 largeTDGreenRed 34","0_to_99 largeTDGreenRed 35","0_to_99 largeTDGreenRed 36","0_to_99 largeTDGreenRed 37","0_to_99 largeTDGreenRed 38","0_to_99 largeTDGreenRed 39","0_to_99 largeTDGreenRed 40","0_to_99 largeTDGreenRed 41","0_to_99 largeTDGreenRed 42","0_to_99 largeTDGreenRed 43","0_to_99 largeTDGreenRed 44","0_to_99 largeTDGreenRed 45","0_to_99 largeTDGreenRed 46","0_to_99 largeTDGreenRed 47","0_to_99 largeTDGreenRed 48","0_to_99 largeTDGreenRed 49","0_to_99 largeTDGreenRed 50","0_to_99 largeTDGreenRed 51","0_to_99 largeTDGreenRed 52","0_to_99 largeTDGreenRed 53","0_to_99 largeTDGreenRed 54","0_to_99 largeTDGreenRed 55","0_to_99 largeTDGreenRed 56","0_to_99 largeTDGreenRed 57","0_to_99 largeTDGreenRed 58","0_to_99 largeTDGreenRed 59","0_to_99 largeTDGreenRed 60","0_to_99 largeTDGreenRed 61","0_to_99 largeTDGreenRed 62","0_to_99 largeTDGreenRed 63","0_to_99 largeTDGreenRed 64","0_to_99 largeTDGreenRed 65","0_to_99 largeTDGreenRed 66","0_to_99 largeTDGreenRed 67","0_to_99 largeTDGreenRed 68","0_to_99 largeTDGreenRed 69","0_to_99 largeTDGreenRed 70","0_to_99 largeTDGreenRed 71","0_to_99 largeTDGreenRed 72","0_to_99 largeTDGreenRed 73","0_to_99 largeTDGreenRed 74","0_to_99 largeTDGreenRed 75","0_to_99 largeTDGreenRed 76","0_to_99 largeTDGreenRed 77","0_to_99 largeTDGreenRed 78","0_to_99 largeTDGreenRed 79","0_to_99 largeTDGreenRed 80","0_to_99 largeTDGreenRed 81","0_to_99 largeTDGreenRed 82","0_to_99 largeTDGreenRed 83","0_to_99 largeTDGreenRed 84","0_to_99 largeTDGreenRed 85","0_to_99 largeTDGreenRed 86","0_to_99 largeTDGreenRed 87","0_to_99 largeTDGreenRed 88","0_to_99 largeTDGreenRed 89","0_to_99 largeTDGreenRed 90","0_to_99 largeTDGreenRed 91","0_to_99 largeTDGreenRed 92","0_to_99 largeTDGreenRed 93","0_to_99 largeTDGreenRed 94","0_to_99 largeTDGreenRed 95","0_to_99 largeTDGreenRed 96","0_to_99 largeTDGreenRed 97","0_to_99 largeTDGreenRed 98","0_to_99 largeTDGreenRed 99","0_to_99 largeTDRed blank","0_to_99 largeTDRed 1","0_to_99 largeTDRed 2","0_to_99 largeTDRed 3","0_to_99 largeTDRed 4","0_to_99 largeTDRed 5","0_to_99 largeTDRed 6","0_to_99 largeTDRed 7","0_to_99 largeTDRed 8","0_to_99 largeTDRed 9","0_to_99 largeTDRed 10","0_to_99 largeTDRed 11","0_to_99 largeTDRed 12","0_to_99 largeTDRed 13","0_to_99 largeTDRed 14","0_to_99 largeTDRed 15","0_to_99 largeTDRed 16","0_to_99 largeTDRed 17","0_to_99 largeTDRed 18","0_to_99 largeTDRed 19","0_to_99 largeTDRed 20","0_to_99 largeTDRed 21","0_to_99 largeTDRed 22","0_to_99 largeTDRed 23","0_to_99 largeTDRed 24","0_to_99 largeTDRed 25","0_to_99 largeTDRed 26","0_to_99 largeTDRed 27","0_to_99 largeTDRed 28","0_to_99 largeTDRed 29","0_to_99 largeTDRed 30","0_to_99 largeTDRed 31","0_to_99 largeTDRed 32","0_to_99 largeTDRed 33","0_to_99 largeTDRed 34","0_to_99 largeTDRed 35","0_to_99 largeTDRed 36","0_to_99 largeTDRed 37","0_to_99 largeTDRed 38","0_to_99 largeTDRed 39","0_to_99 largeTDRed 40","0_to_99 largeTDRed 41","0_to_99 largeTDRed 42","0_to_99 largeTDRed 43","0_to_99 largeTDRed 44","0_to_99 largeTDRed 45","0_to_99 largeTDRed 46","0_to_99 largeTDRed 47","0_to_99 largeTDRed 48","0_to_99 largeTDRed 49","0_to_99 largeTDRed 50","0_to_99 largeTDRed 51","0_to_99 largeTDRed 52","0_to_99 largeTDRed 53","0_to_99 largeTDRed 54","0_to_99 largeTDRed 55","0_to_99 largeTDRed 56","0_to_99 largeTDRed 57","0_to_99 largeTDRed 58","0_to_99 largeTDRed 59","0_to_99 largeTDRed 60","0_to_99 largeTDRed 61","0_to_99 largeTDRed 62","0_to_99 largeTDRed 63","0_to_99 largeTDRed 64","0_to_99 largeTDRed 65","0_to_99 largeTDRed 66","0_to_99 largeTDRed 67","0_to_99 largeTDRed 68","0_to_99 largeTDRed 69","0_to_99 largeTDRed 70","0_to_99 largeTDRed 71","0_to_99 largeTDRed 72","0_to_99 largeTDRed 73","0_to_99 largeTDRed 74","0_to_99 largeTDRed 75","0_to_99 largeTDRed 76","0_to_99 largeTDRed 77","0_to_99 largeTDRed 78","0_to_99 largeTDRed 79","0_to_99 largeTDRed 80","0_to_99 largeTDRed 81","0_to_99 largeTDRed 82","0_to_99 largeTDRed 83","0_to_99 largeTDRed 84","0_to_99 largeTDRed 85","0_to_99 largeTDRed 86","0_to_99 largeTDRed 87","0_to_99 largeTDRed 88","0_to_99 largeTDRed 89","0_to_99 largeTDRed 90","0_to_99 largeTDRed 91","0_to_99 largeTDRed 92","0_to_99 largeTDRed 93","0_to_99 largeTDRed 94","0_to_99 largeTDRed 95","0_to_99 largeTDRed 96","0_to_99 largeTDRed 97","0_to_99 largeTDRed 98","0_to_99 largeTDRed 99","0_to_99 largeTDYellow blank","0_to_99 largeTDYellow 1","0_to_99 largeTDYellow 2","0_to_99 largeTDYellow 3","0_to_99 largeTDYellow 4","0_to_99 largeTDYellow 5","0_to_99 largeTDYellow 6","0_to_99 largeTDYellow 7","0_to_99 largeTDYellow 8","0_to_99 largeTDYellow 9","0_to_99 largeTDYellow 10","0_to_99 largeTDYellow 11","0_to_99 largeTDYellow 12","0_to_99 largeTDYellow 13","0_to_99 largeTDYellow 14","0_to_99 largeTDYellow 15","0_to_99 largeTDYellow 16","0_to_99 largeTDYellow 17","0_to_99 largeTDYellow 18","0_to_99 largeTDYellow 19","0_to_99 largeTDYellow 20","0_to_99 largeTDYellow 21","0_to_99 largeTDYellow 22","0_to_99 largeTDYellow 23","0_to_99 largeTDYellow 24","0_to_99 largeTDYellow 25","0_to_99 largeTDYellow 26","0_to_99 largeTDYellow 27","0_to_99 largeTDYellow 28","0_to_99 largeTDYellow 29","0_to_99 largeTDYellow 30","0_to_99 largeTDYellow 31","0_to_99 largeTDYellow 32","0_to_99 largeTDYellow 33","0_to_99 largeTDYellow 34","0_to_99 largeTDYellow 35","0_to_99 largeTDYellow 36","0_to_99 largeTDYellow 37","0_to_99 largeTDYellow 38","0_to_99 largeTDYellow 39","0_to_99 largeTDYellow 40","0_to_99 largeTDYellow 41","0_to_99 largeTDYellow 42","0_to_99 largeTDYellow 43","0_to_99 largeTDYellow 44","0_to_99 largeTDYellow 45","0_to_99 largeTDYellow 46","0_to_99 largeTDYellow 47","0_to_99 largeTDYellow 48","0_to_99 largeTDYellow 49","0_to_99 largeTDYellow 50","0_to_99 largeTDYellow 51","0_to_99 largeTDYellow 52","0_to_99 largeTDYellow 53","0_to_99 largeTDYellow 54","0_to_99 largeTDYellow 55","0_to_99 largeTDYellow 56","0_to_99 largeTDYellow 57","0_to_99 largeTDYellow 58","0_to_99 largeTDYellow 59","0_to_99 largeTDYellow 60","0_to_99 largeTDYellow 61","0_to_99 largeTDYellow 62","0_to_99 largeTDYellow 63","0_to_99 largeTDYellow 64","0_to_99 largeTDYellow 65","0_to_99 largeTDYellow 66","0_to_99 largeTDYellow 67","0_to_99 largeTDYellow 68","0_to_99 largeTDYellow 69","0_to_99 largeTDYellow 70","0_to_99 largeTDYellow 71","0_to_99 largeTDYellow 72","0_to_99 largeTDYellow 73","0_to_99 largeTDYellow 74","0_to_99 largeTDYellow 75","0_to_99 largeTDYellow 76","0_to_99 largeTDYellow 77","0_to_99 largeTDYellow 78","0_to_99 largeTDYellow 79","0_to_99 largeTDYellow 80","0_to_99 largeTDYellow 81","0_to_99 largeTDYellow 82","0_to_99 largeTDYellow 83","0_to_99 largeTDYellow 84","0_to_99 largeTDYellow 85","0_to_99 largeTDYellow 86","0_to_99 largeTDYellow 87","0_to_99 largeTDYellow 88","0_to_99 largeTDYellow 89","0_to_99 largeTDYellow 90","0_to_99 largeTDYellow 91","0_to_99 largeTDYellow 92","0_to_99 largeTDYellow 93","0_to_99 largeTDYellow 94","0_to_99 largeTDYellow 95","0_to_99 largeTDYellow 96","0_to_99 largeTDYellow 97","0_to_99 largeTDYellow 98","0_to_99 largeTDYellow 99","0_to_99 orange blank","0_to_99 orange 1","0_to_99 orange 2","0_to_99 orange 3","0_to_99 orange 4","0_to_99 orange 5","0_to_99 orange 6","0_to_99 orange 7","0_to_99 orange 8","0_to_99 orange 9","0_to_99 orange 10","0_to_99 orange 11","0_to_99 orange 12","0_to_99 orange 13","0_to_99 orange 14","0_to_99 orange 15","0_to_99 orange 16","0_to_99 orange 17","0_to_99 orange 18","0_to_99 orange 19","0_to_99 orange 20","0_to_99 orange 21","0_to_99 orange 22","0_to_99 orange 23","0_to_99 orange 24","0_to_99 orange 25","0_to_99 orange 26","0_to_99 orange 27","0_to_99 orange 28","0_to_99 orange 29","0_to_99 orange 30","0_to_99 orange 31","0_to_99 orange 32","0_to_99 orange 33","0_to_99 orange 34","0_to_99 orange 35","0_to_99 orange 36","0_to_99 orange 37","0_to_99 orange 38","0_to_99 orange 39","0_to_99 orange 40","0_to_99 orange 41","0_to_99 orange 42","0_to_99 orange 43","0_to_99 orange 44","0_to_99 orange 45","0_to_99 orange 46","0_to_99 orange 47","0_to_99 orange 48","0_to_99 orange 49","0_to_99 orange 50","0_to_99 orange 51","0_to_99 orange 52","0_to_99 orange 53","0_to_99 orange 54","0_to_99 orange 55","0_to_99 orange 56","0_to_99 orange 57","0_to_99 orange 58","0_to_99 orange 59","0_to_99 orange 60","0_to_99 orange 61","0_to_99 orange 62","0_to_99 orange 63","0_to_99 orange 64","0_to_99 orange 65","0_to_99 orange 66","0_to_99 orange 67","0_to_99 orange 68","0_to_99 orange 69","0_to_99 orange 70","0_to_99 orange 71","0_to_99 orange 72","0_to_99 orange 73","0_to_99 orange 74","0_to_99 orange 75","0_to_99 orange 76","0_to_99 orange 77","0_to_99 orange 78","0_to_99 orange 79","0_to_99 orange 80","0_to_99 orange 81","0_to_99 orange 82","0_to_99 orange 83","0_to_99 orange 84","0_to_99 orange 85","0_to_99 orange 86","0_to_99 orange 87","0_to_99 orange 88","0_to_99 orange 89","0_to_99 orange 90","0_to_99 orange 91","0_to_99 orange 92","0_to_99 orange 93","0_to_99 orange 94","0_to_99 orange 95","0_to_99 orange 96","0_to_99 orange 97","0_to_99 orange 98","0_to_99 orange 99","0_to_99 pink blank","0_to_99 pink 1","0_to_99 pink 2","0_to_99 pink 3","0_to_99 pink 4","0_to_99 pink 5","0_to_99 pink 6","0_to_99 pink 7","0_to_99 pink 8","0_to_99 pink 9","0_to_99 pink 10","0_to_99 pink 11","0_to_99 pink 12","0_to_99 pink 13","0_to_99 pink 14","0_to_99 pink 15","0_to_99 pink 16","0_to_99 pink 17","0_to_99 pink 18","0_to_99 pink 19","0_to_99 pink 20","0_to_99 pink 21","0_to_99 pink 22","0_to_99 pink 23","0_to_99 pink 24","0_to_99 pink 25","0_to_99 pink 26","0_to_99 pink 27","0_to_99 pink 28","0_to_99 pink 29","0_to_99 pink 30","0_to_99 pink 31","0_to_99 pink 32","0_to_99 pink 33","0_to_99 pink 34","0_to_99 pink 35","0_to_99 pink 36","0_to_99 pink 37","0_to_99 pink 38","0_to_99 pink 39","0_to_99 pink 40","0_to_99 pink 41","0_to_99 pink 42","0_to_99 pink 43","0_to_99 pink 44","0_to_99 pink 45","0_to_99 pink 46","0_to_99 pink 47","0_to_99 pink 48","0_to_99 pink 49","0_to_99 pink 50","0_to_99 pink 51","0_to_99 pink 52","0_to_99 pink 53","0_to_99 pink 54","0_to_99 pink 55","0_to_99 pink 56","0_to_99 pink 57","0_to_99 pink 58","0_to_99 pink 59","0_to_99 pink 60","0_to_99 pink 61","0_to_99 pink 62","0_to_99 pink 63","0_to_99 pink 64","0_to_99 pink 65","0_to_99 pink 66","0_to_99 pink 67","0_to_99 pink 68","0_to_99 pink 69","0_to_99 pink 70","0_to_99 pink 71","0_to_99 pink 72","0_to_99 pink 73","0_to_99 pink 74","0_to_99 pink 75","0_to_99 pink 76","0_to_99 pink 77","0_to_99 pink 78","0_to_99 pink 79","0_to_99 pink 80","0_to_99 pink 81","0_to_99 pink 82","0_to_99 pink 83","0_to_99 pink 84","0_to_99 pink 85","0_to_99 pink 86","0_to_99 pink 87","0_to_99 pink 88","0_to_99 pink 89","0_to_99 pink 90","0_to_99 pink 91","0_to_99 pink 92","0_to_99 pink 93","0_to_99 pink 94","0_to_99 pink 95","0_to_99 pink 96","0_to_99 pink 97","0_to_99 pink 98","0_to_99 pink 99","0_to_99 red blank","0_to_99 red 1","0_to_99 red 2","0_to_99 red 3","0_to_99 red 4","0_to_99 red 5","0_to_99 red 6","0_to_99 red 7","0_to_99 red 8","0_to_99 red 9","0_to_99 red 10","0_to_99 red 11","0_to_99 red 12","0_to_99 red 13","0_to_99 red 14","0_to_99 red 15","0_to_99 red 16","0_to_99 red 17","0_to_99 red 18","0_to_99 red 19","0_to_99 red 20","0_to_99 red 21","0_to_99 red 22","0_to_99 red 23","0_to_99 red 24","0_to_99 red 25","0_to_99 red 26","0_to_99 red 27","0_to_99 red 28","0_to_99 red 29","0_to_99 red 30","0_to_99 red 31","0_to_99 red 32","0_to_99 red 33","0_to_99 red 34","0_to_99 red 35","0_to_99 red 36","0_to_99 red 37","0_to_99 red 38","0_to_99 red 39","0_to_99 red 40","0_to_99 red 41","0_to_99 red 42","0_to_99 red 43","0_to_99 red 44","0_to_99 red 45","0_to_99 red 46","0_to_99 red 47","0_to_99 red 48","0_to_99 red 49","0_to_99 red 50","0_to_99 red 51","0_to_99 red 52","0_to_99 red 53","0_to_99 red 54","0_to_99 red 55","0_to_99 red 56","0_to_99 red 57","0_to_99 red 58","0_to_99 red 59","0_to_99 red 60","0_to_99 red 61","0_to_99 red 62","0_to_99 red 63","0_to_99 red 64","0_to_99 red 65","0_to_99 red 66","0_to_99 red 67","0_to_99 red 68","0_to_99 red 69","0_to_99 red 70","0_to_99 red 71","0_to_99 red 72","0_to_99 red 73","0_to_99 red 74","0_to_99 red 75","0_to_99 red 76","0_to_99 red 77","0_to_99 red 78","0_to_99 red 79","0_to_99 red 80","0_to_99 red 81","0_to_99 red 82","0_to_99 red 83","0_to_99 red 84","0_to_99 red 85","0_to_99 red 86","0_to_99 red 87","0_to_99 red 88","0_to_99 red 89","0_to_99 red 90","0_to_99 red 91","0_to_99 red 92","0_to_99 red 93","0_to_99 red 94","0_to_99 red 95","0_to_99 red 96","0_to_99 red 97","0_to_99 red 98","0_to_99 red 99"],["","Blue Blank","Blue 1","Blue 2","Blue 3","Blue 4","Blue 5","Blue 6","Blue 7","Blue 8","Blue 9","Blue 10","Blue 11","Blue 12","Blue 13","Blue 14","Blue 15","Blue 16","Blue 17","Blue 18","Blue 19","Blue 20","Blue 21","Blue 22","Blue 23","Blue 24","Blue 25","Blue 26","Blue 27","Blue 28","Blue 29","Blue 30","Blue 31","Blue 32","Blue 33","Blue 34","Blue 35","Blue 36","Blue 37","Blue 38","Blue 39","Blue 40","Blue 41","Blue 42","Blue 43","Blue 44","Blue 45","Blue 46","Blue 47","Blue 48","Blue 49","Blue 50","Blue 51","Blue 52","Blue 53","Blue 54","Blue 55","Blue 56","Blue 57","Blue 58","Blue 59","Blue 60","Blue 61","Blue 62","Blue 63","Blue 64","Blue 65","Blue 66","Blue 67","Blue 68","Blue 69","Blue 70","Blue 71","Blue 72","Blue 73","Blue 74","Blue 75","Blue 76","Blue 77","Blue 78","Blue 79","Blue 80","Blue 81","Blue 82","Blue 83","Blue 84","Blue 85","Blue 86","Blue 87","Blue 88","Blue 89","Blue 90","Blue 91","Blue 92","Blue 93","Blue 94","Blue 95","Blue 96","Blue 97","Blue 98","Blue 99","Green Blank","Green 1","Green 2","Green 3","Green 4","Green 5","Green 6","Green 7","Green 8","Green 9","Green 10","Green 11","Green 12","Green 13","Green 14","Green 15","Green 16","Green 17","Green 18","Green 19","Green 20","Green 21","Green 22","Green 23","Green 24","Green 25","Green 26","Green 27","Green 28","Green 29","Green 30","Green 31","Green 32","Green 33","Green 34","Green 35","Green 36","Green 37","Green 38","Green 39","Green 40","Green 41","Green 42","Green 43","Green 44","Green 45","Green 46","Green 47","Green 48","Green 49","Green 50","Green 51","Green 52","Green 53","Green 54","Green 55","Green 56","Green 57","Green 58","Green 59","Green 60","Green 61","Green 62","Green 63","Green 64","Green 65","Green 66","Green 67","Green 68","Green 69","Green 70","Green 71","Green 72","Green 73","Green 74","Green 75","Green 76","Green 77","Green 78","Green 79","Green 80","Green 81","Green 82","Green 83","Green 84","Green 85","Green 86","Green 87","Green 88","Green 89","Green 90","Green 91","Green 92","Green 93","Green 94","Green 95","Green 96","Green 97","Green 98","Green 99","largeTDBlue Blank","largeTDBlue 1","largeTDBlue 2","largeTDBlue 3","largeTDBlue 4","largeTDBlue 5","largeTDBlue 6","largeTDBlue 7","largeTDBlue 8","largeTDBlue 9","largeTDBlue 10","largeTDBlue 11","largeTDBlue 12","largeTDBlue 13","largeTDBlue 14","largeTDBlue 15","largeTDBlue 16","largeTDBlue 17","largeTDBlue 18","largeTDBlue 19","largeTDBlue 20","largeTDBlue 21","largeTDBlue 22","largeTDBlue 23","largeTDBlue 24","largeTDBlue 25","largeTDBlue 26","largeTDBlue 27","largeTDBlue 28","largeTDBlue 29","largeTDBlue 30","largeTDBlue 31","largeTDBlue 32","largeTDBlue 33","largeTDBlue 34","largeTDBlue 35","largeTDBlue 36","largeTDBlue 37","largeTDBlue 38","largeTDBlue 39","largeTDBlue 40","largeTDBlue 41","largeTDBlue 42","largeTDBlue 43","largeTDBlue 44","largeTDBlue 45","largeTDBlue 46","largeTDBlue 47","largeTDBlue 48","largeTDBlue 49","largeTDBlue 50","largeTDBlue 51","largeTDBlue 52","largeTDBlue 53","largeTDBlue 54","largeTDBlue 55","largeTDBlue 56","largeTDBlue 57","largeTDBlue 58","largeTDBlue 59","largeTDBlue 60","largeTDBlue 61","largeTDBlue 62","largeTDBlue 63","largeTDBlue 64","largeTDBlue 65","largeTDBlue 66","largeTDBlue 67","largeTDBlue 68","largeTDBlue 69","largeTDBlue 70","largeTDBlue 71","largeTDBlue 72","largeTDBlue 73","largeTDBlue 74","largeTDBlue 75","largeTDBlue 76","largeTDBlue 77","largeTDBlue 78","largeTDBlue 79","largeTDBlue 80","largeTDBlue 81","largeTDBlue 82","largeTDBlue 83","largeTDBlue 84","largeTDBlue 85","largeTDBlue 86","largeTDBlue 87","largeTDBlue 88","largeTDBlue 89","largeTDBlue 90","largeTDBlue 91","largeTDBlue 92","largeTDBlue 93","largeTDBlue 94","largeTDBlue 95","largeTDBlue 96","largeTDBlue 97","largeTDBlue 98","largeTDBlue 99","largeTDBlueRed Blank","largeTDBlueRed 1","largeTDBlueRed 2","largeTDBlueRed 3","largeTDBlueRed 4","largeTDBlueRed 5","largeTDBlueRed 6","largeTDBlueRed 7","largeTDBlueRed 8","largeTDBlueRed 9","largeTDBlueRed 10","largeTDBlueRed 11","largeTDBlueRed 12","largeTDBlueRed 13","largeTDBlueRed 14","largeTDBlueRed 15","largeTDBlueRed 16","largeTDBlueRed 17","largeTDBlueRed 18","largeTDBlueRed 19","largeTDBlueRed 20","largeTDBlueRed 21","largeTDBlueRed 22","largeTDBlueRed 23","largeTDBlueRed 24","largeTDBlueRed 25","largeTDBlueRed 26","largeTDBlueRed 27","largeTDBlueRed 28","largeTDBlueRed 29","largeTDBlueRed 30","largeTDBlueRed 31","largeTDBlueRed 32","largeTDBlueRed 33","largeTDBlueRed 34","largeTDBlueRed 35","largeTDBlueRed 36","largeTDBlueRed 37","largeTDBlueRed 38","largeTDBlueRed 39","largeTDBlueRed 40","largeTDBlueRed 41","largeTDBlueRed 42","largeTDBlueRed 43","largeTDBlueRed 44","largeTDBlueRed 45","largeTDBlueRed 46","largeTDBlueRed 47","largeTDBlueRed 48","largeTDBlueRed 49","largeTDBlueRed 50","largeTDBlueRed 51","largeTDBlueRed 52","largeTDBlueRed 53","largeTDBlueRed 54","largeTDBlueRed 55","largeTDBlueRed 56","largeTDBlueRed 57","largeTDBlueRed 58","largeTDBlueRed 59","largeTDBlueRed 60","largeTDBlueRed 61","largeTDBlueRed 62","largeTDBlueRed 63","largeTDBlueRed 64","largeTDBlueRed 65","largeTDBlueRed 66","largeTDBlueRed 67","largeTDBlueRed 68","largeTDBlueRed 69","largeTDBlueRed 70","largeTDBlueRed 71","largeTDBlueRed 72","largeTDBlueRed 73","largeTDBlueRed 74","largeTDBlueRed 75","largeTDBlueRed 76","largeTDBlueRed 77","largeTDBlueRed 78","largeTDBlueRed 79","largeTDBlueRed 80","largeTDBlueRed 81","largeTDBlueRed 82","largeTDBlueRed 83","largeTDBlueRed 84","largeTDBlueRed 85","largeTDBlueRed 86","largeTDBlueRed 87","largeTDBlueRed 88","largeTDBlueRed 89","largeTDBlueRed 90","largeTDBlueRed 91","largeTDBlueRed 92","largeTDBlueRed 93","largeTDBlueRed 94","largeTDBlueRed 95","largeTDBlueRed 96","largeTDBlueRed 97","largeTDBlueRed 98","largeTDBlueRed 99","largeTDGreen Blank","largeTDGreen 1","largeTDGreen 2","largeTDGreen 3","largeTDGreen 4","largeTDGreen 5","largeTDGreen 6","largeTDGreen 7","largeTDGreen 8","largeTDGreen 9","largeTDGreen 10","largeTDGreen 11","largeTDGreen 12","largeTDGreen 13","largeTDGreen 14","largeTDGreen 15","largeTDGreen 16","largeTDGreen 17","largeTDGreen 18","largeTDGreen 19","largeTDGreen 20","largeTDGreen 21","largeTDGreen 22","largeTDGreen 23","largeTDGreen 24","largeTDGreen 25","largeTDGreen 26","largeTDGreen 27","largeTDGreen 28","largeTDGreen 29","largeTDGreen 30","largeTDGreen 31","largeTDGreen 32","largeTDGreen 33","largeTDGreen 34","largeTDGreen 35","largeTDGreen 36","largeTDGreen 37","largeTDGreen 38","largeTDGreen 39","largeTDGreen 40","largeTDGreen 41","largeTDGreen 42","largeTDGreen 43","largeTDGreen 44","largeTDGreen 45","largeTDGreen 46","largeTDGreen 47","largeTDGreen 48","largeTDGreen 49","largeTDGreen 50","largeTDGreen 51","largeTDGreen 52","largeTDGreen 53","largeTDGreen 54","largeTDGreen 55","largeTDGreen 56","largeTDGreen 57","largeTDGreen 58","largeTDGreen 59","largeTDGreen 60","largeTDGreen 61","largeTDGreen 62","largeTDGreen 63","largeTDGreen 64","largeTDGreen 65","largeTDGreen 66","largeTDGreen 67","largeTDGreen 68","largeTDGreen 69","largeTDGreen 70","largeTDGreen 71","largeTDGreen 72","largeTDGreen 73","largeTDGreen 74","largeTDGreen 75","largeTDGreen 76","largeTDGreen 77","largeTDGreen 78","largeTDGreen 79","largeTDGreen 80","largeTDGreen 81","largeTDGreen 82","largeTDGreen 83","largeTDGreen 84","largeTDGreen 85","largeTDGreen 86","largeTDGreen 87","largeTDGreen 88","largeTDGreen 89","largeTDGreen 90","largeTDGreen 91","largeTDGreen 92","largeTDGreen 93","largeTDGreen 94","largeTDGreen 95","largeTDGreen 96","largeTDGreen 97","largeTDGreen 98","largeTDGreen 99","largeTDGreenRed Blank","largeTDGreenRed 1","largeTDGreenRed 2","largeTDGreenRed 3","largeTDGreenRed 4","largeTDGreenRed 5","largeTDGreenRed 6","largeTDGreenRed 7","largeTDGreenRed 8","largeTDGreenRed 9","largeTDGreenRed 10","largeTDGreenRed 11","largeTDGreenRed 12","largeTDGreenRed 13","largeTDGreenRed 14","largeTDGreenRed 15","largeTDGreenRed 16","largeTDGreenRed 17","largeTDGreenRed 18","largeTDGreenRed 19","largeTDGreenRed 20","largeTDGreenRed 21","largeTDGreenRed 22","largeTDGreenRed 23","largeTDGreenRed 24","largeTDGreenRed 25","largeTDGreenRed 26","largeTDGreenRed 27","largeTDGreenRed 28","largeTDGreenRed 29","largeTDGreenRed 30","largeTDGreenRed 31","largeTDGreenRed 32","largeTDGreenRed 33","largeTDGreenRed 34","largeTDGreenRed 35","largeTDGreenRed 36","largeTDGreenRed 37","largeTDGreenRed 38","largeTDGreenRed 39","largeTDGreenRed 40","largeTDGreenRed 41","largeTDGreenRed 42","largeTDGreenRed 43","largeTDGreenRed 44","largeTDGreenRed 45","largeTDGreenRed 46","largeTDGreenRed 47","largeTDGreenRed 48","largeTDGreenRed 49","largeTDGreenRed 50","largeTDGreenRed 51","largeTDGreenRed 52","largeTDGreenRed 53","largeTDGreenRed 54","largeTDGreenRed 55","largeTDGreenRed 56","largeTDGreenRed 57","largeTDGreenRed 58","largeTDGreenRed 59","largeTDGreenRed 60","largeTDGreenRed 61","largeTDGreenRed 62","largeTDGreenRed 63","largeTDGreenRed 64","largeTDGreenRed 65","largeTDGreenRed 66","largeTDGreenRed 67","largeTDGreenRed 68","largeTDGreenRed 69","largeTDGreenRed 70","largeTDGreenRed 71","largeTDGreenRed 72","largeTDGreenRed 73","largeTDGreenRed 74","largeTDGreenRed 75","largeTDGreenRed 76","largeTDGreenRed 77","largeTDGreenRed 78","largeTDGreenRed 79","largeTDGreenRed 80","largeTDGreenRed 81","largeTDGreenRed 82","largeTDGreenRed 83","largeTDGreenRed 84","largeTDGreenRed 85","largeTDGreenRed 86","largeTDGreenRed 87","largeTDGreenRed 88","largeTDGreenRed 89","largeTDGreenRed 90","largeTDGreenRed 91","largeTDGreenRed 92","largeTDGreenRed 93","largeTDGreenRed 94","largeTDGreenRed 95","largeTDGreenRed 96","largeTDGreenRed 97","largeTDGreenRed 98","largeTDGreenRed 99","largeTDRed Blank","largeTDRed 1","largeTDRed 2","largeTDRed 3","largeTDRed 4","largeTDRed 5","largeTDRed 6","largeTDRed 7","largeTDRed 8","largeTDRed 9","largeTDRed 10","largeTDRed 11","largeTDRed 12","largeTDRed 13","largeTDRed 14","largeTDRed 15","largeTDRed 16","largeTDRed 17","largeTDRed 18","largeTDRed 19","largeTDRed 20","largeTDRed 21","largeTDRed 22","largeTDRed 23","largeTDRed 24","largeTDRed 25","largeTDRed 26","largeTDRed 27","largeTDRed 28","largeTDRed 29","largeTDRed 30","largeTDRed 31","largeTDRed 32","largeTDRed 33","largeTDRed 34","largeTDRed 35","largeTDRed 36","largeTDRed 37","largeTDRed 38","largeTDRed 39","largeTDRed 40","largeTDRed 41","largeTDRed 42","largeTDRed 43","largeTDRed 44","largeTDRed 45","largeTDRed 46","largeTDRed 47","largeTDRed 48","largeTDRed 49","largeTDRed 50","largeTDRed 51","largeTDRed 52","largeTDRed 53","largeTDRed 54","largeTDRed 55","largeTDRed 56","largeTDRed 57","largeTDRed 58","largeTDRed 59","largeTDRed 60","largeTDRed 61","largeTDRed 62","largeTDRed 63","largeTDRed 64","largeTDRed 65","largeTDRed 66","largeTDRed 67","largeTDRed 68","largeTDRed 69","largeTDRed 70","largeTDRed 71","largeTDRed 72","largeTDRed 73","largeTDRed 74","largeTDRed 75","largeTDRed 76","largeTDRed 77","largeTDRed 78","largeTDRed 79","largeTDRed 80","largeTDRed 81","largeTDRed 82","largeTDRed 83","largeTDRed 84","largeTDRed 85","largeTDRed 86","largeTDRed 87","largeTDRed 88","largeTDRed 89","largeTDRed 90","largeTDRed 91","largeTDRed 92","largeTDRed 93","largeTDRed 94","largeTDRed 95","largeTDRed 96","largeTDRed 97","largeTDRed 98","largeTDRed 99","largeTDYellow Blank","largeTDYellow 1","largeTDYellow 2","largeTDYellow 3","largeTDYellow 4","largeTDYellow 5","largeTDYellow 6","largeTDYellow 7","largeTDYellow 8","largeTDYellow 9","largeTDYellow 10","largeTDYellow 11","largeTDYellow 12","largeTDYellow 13","largeTDYellow 14","largeTDYellow 15","largeTDYellow 16","largeTDYellow 17","largeTDYellow 18","largeTDYellow 19","largeTDYellow 20","largeTDYellow 21","largeTDYellow 22","largeTDYellow 23","largeTDYellow 24","largeTDYellow 25","largeTDYellow 26","largeTDYellow 27","largeTDYellow 28","largeTDYellow 29","largeTDYellow 30","largeTDYellow 31","largeTDYellow 32","largeTDYellow 33","largeTDYellow 34","largeTDYellow 35","largeTDYellow 36","largeTDYellow 37","largeTDYellow 38","largeTDYellow 39","largeTDYellow 40","largeTDYellow 41","largeTDYellow 42","largeTDYellow 43","largeTDYellow 44","largeTDYellow 45","largeTDYellow 46","largeTDYellow 47","largeTDYellow 48","largeTDYellow 49","largeTDYellow 50","largeTDYellow 51","largeTDYellow 52","largeTDYellow 53","largeTDYellow 54","largeTDYellow 55","largeTDYellow 56","largeTDYellow 57","largeTDYellow 58","largeTDYellow 59","largeTDYellow 60","largeTDYellow 61","largeTDYellow 62","largeTDYellow 63","largeTDYellow 64","largeTDYellow 65","largeTDYellow 66","largeTDYellow 67","largeTDYellow 68","largeTDYellow 69","largeTDYellow 70","largeTDYellow 71","largeTDYellow 72","largeTDYellow 73","largeTDYellow 74","largeTDYellow 75","largeTDYellow 76","largeTDYellow 77","largeTDYellow 78","largeTDYellow 79","largeTDYellow 80","largeTDYellow 81","largeTDYellow 82","largeTDYellow 83","largeTDYellow 84","largeTDYellow 85","largeTDYellow 86","largeTDYellow 87","largeTDYellow 88","largeTDYellow 89","largeTDYellow 90","largeTDYellow 91","largeTDYellow 92","largeTDYellow 93","largeTDYellow 94","largeTDYellow 95","largeTDYellow 96","largeTDYellow 97","largeTDYellow 98","largeTDYellow 99","Orange Blank","Orange 1","Orange 2","Orange 3","Orange 4","Orange 5","Orange 6","Orange 7","Orange 8","Orange 9","Orange 10","Orange 11","Orange 12","Orange 13","Orange 14","Orange 15","Orange 16","Orange 17","Orange 18","Orange 19","Orange 20","Orange 21","Orange 22","Orange 23","Orange 24","Orange 25","Orange 26","Orange 27","Orange 28","Orange 29","Orange 30","Orange 31","Orange 32","Orange 33","Orange 34","Orange 35","Orange 36","Orange 37","Orange 38","Orange 39","Orange 40","Orange 41","Orange 42","Orange 43","Orange 44","Orange 45","Orange 46","Orange 47","Orange 48","Orange 49","Orange 50","Orange 51","Orange 52","Orange 53","Orange 54","Orange 55","Orange 56","Orange 57","Orange 58","Orange 59","Orange 60","Orange 61","Orange 62","Orange 63","Orange 64","Orange 65","Orange 66","Orange 67","Orange 68","Orange 69","Orange 70","Orange 71","Orange 72","Orange 73","Orange 74","Orange 75","Orange 76","Orange 77","Orange 78","Orange 79","Orange 80","Orange 81","Orange 82","Orange 83","Orange 84","Orange 85","Orange 86","Orange 87","Orange 88","Orange 89","Orange 90","Orange 91","Orange 92","Orange 93","Orange 94","Orange 95","Orange 96","Orange 97","Orange 98","Orange 99","Pink Blank","Pink 1","Pink 2","Pink 3","Pink 4","Pink 5","Pink 6","Pink 7","Pink 8","Pink 9","Pink 10","Pink 11","Pink 12","Pink 13","Pink 14","Pink 15","Pink 16","Pink 17","Pink 18","Pink 19","Pink 20","Pink 21","Pink 22","Pink 23","Pink 24","Pink 25","Pink 26","Pink 27","Pink 28","Pink 29","Pink 30","Pink 31","Pink 32","Pink 33","Pink 34","Pink 35","Pink 36","Pink 37","Pink 38","Pink 39","Pink 40","Pink 41","Pink 42","Pink 43","Pink 44","Pink 45","Pink 46","Pink 47","Pink 48","Pink 49","Pink 50","Pink 51","Pink 52","Pink 53","Pink 54","Pink 55","Pink 56","Pink 57","Pink 58","Pink 59","Pink 60","Pink 61","Pink 62","Pink 63","Pink 64","Pink 65","Pink 66","Pink 67","Pink 68","Pink 69","Pink 70","Pink 71","Pink 72","Pink 73","Pink 74","Pink 75","Pink 76","Pink 77","Pink 78","Pink 79","Pink 80","Pink 81","Pink 82","Pink 83","Pink 84","Pink 85","Pink 86","Pink 87","Pink 88","Pink 89","Pink 90","Pink 91","Pink 92","Pink 93","Pink 94","Pink 95","Pink 96","Pink 97","Pink 98","Pink 99","Red Blank","Red 1","Red 2","Red 3","Red 4","Red 5","Red 6","Red 7","Red 8","Red 9","Red 10","Red 11","Red 12","Red 13","Red 14","Red 15","Red 16","Red 17","Red 18","Red 19","Red 20","Red 21","Red 22","Red 23","Red 24","Red 25","Red 26","Red 27","Red 28","Red 29","Red 30","Red 31","Red 32","Red 33","Red 34","Red 35","Red 36","Red 37","Red 38","Red 39","Red 40","Red 41","Red 42","Red 43","Red 44","Red 45","Red 46","Red 47","Red 48","Red 49","Red 50","Red 51","Red 52","Red 53","Red 54","Red 55","Red 56","Red 57","Red 58","Red 59","Red 60","Red 61","Red 62","Red 63","Red 64","Red 65","Red 66","Red 67","Red 68","Red 69","Red 70","Red 71","Red 72","Red 73","Red 74","Red 75","Red 76","Red 77","Red 78","Red 79","Red 80","Red 81","Red 82","Red 83","Red 84","Red 85","Red 86","Red 87","Red 88","Red 89","Red 90","Red 91","Red 92","Red 93","Red 94","Red 95","Red 96","Red 97","Red 98","Red 99"],[[],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[17],[18],[19],[20],[21],[22],[23],[24],[25],[26],[27],[28],[29],[30],[31],[32],[33],[34],[35],[36],[37],[38],[39],[40],[41],[42],[43],[44],[45],[46],[47],[48],[49],[50],[51],[52],[53],[54],[55],[56],[57],[58],[59],[60],[61],[62],[63],[64],[65],[66],[67],[68],[69],[70],[71],[72],[73],[74],[75],[76],[77],[78],[79],[80],[81],[82],[83],[84],[85],[86],[87],[88],[89],[90],[91],[92],[93],[94],[95],[96],[97],[98],[99],[100],[101],[102],[103],[104],[105],[106],[107],[108],[109],[110],[111],[112],[113],[114],[115],[116],[117],[118],[119],[120],[121],[122],[123],[124],[125],[126],[127],[128],[129],[130],[131],[132],[133],[134],[135],[136],[137],[138],[139],[140],[141],[142],[143],[144],[145],[146],[147],[148],[149],[150],[151],[152],[153],[154],[155],[156],[157],[158],[159],[160],[161],[162],[163],[164],[165],[166],[167],[168],[169],[170],[171],[172],[173],[174],[175],[176],[177],[178],[179],[180],[181],[182],[183],[184],[185],[186],[187],[188],[189],[190],[191],[192],[193],[194],[195],[196],[197],[198],[199],[200],[201],[202],[203],[204],[205],[206],[207],[208],[209],[210],[211],[212],[213],[214],[215],[216],[217],[218],[219],[220],[221],[222],[223],[224],[225],[226],[227],[228],[229],[230],[231],[232],[233],[234],[235],[236],[237],[238],[239],[240],[241],[242],[243],[244],[245],[246],[247],[248],[249],[250],[251],[252],[253],[254],[255],[256],[257],[258],[259],[260],[261],[262],[263],[264],[265],[266],[267],[268],[269],[270],[271],[272],[273],[274],[275],[276],[277],[278],[279],[280],[281],[282],[283],[284],[285],[286],[287],[288],[289],[290],[291],[292],[293],[294],[295],[296],[297],[298],[299],[300],[301],[302],[303],[304],[305],[306],[307],[308],[309],[310],[311],[312],[313],[314],[315],[316],[317],[318],[319],[320],[321],[322],[323],[324],[325],[326],[327],[328],[329],[330],[331],[332],[333],[334],[335],[336],[337],[338],[339],[340],[341],[342],[343],[344],[345],[346],[347],[348],[349],[350],[351],[352],[353],[354],[355],[356],[357],[358],[359],[360],[361],[362],[363],[364],[365],[366],[367],[368],[369],[370],[371],[372],[373],[374],[375],[376],[377],[378],[379],[380],[381],[382],[383],[384],[385],[386],[387],[388],[389],[390],[391],[392],[393],[394],[395],[396],[397],[398],[399],[400],[401],[402],[403],[404],[405],[406],[407],[408],[409],[410],[411],[412],[413],[414],[415],[416],[417],[418],[419],[420],[421],[422],[423],[424],[425],[426],[427],[428],[429],[430],[431],[432],[433],[434],[435],[436],[437],[438],[439],[440],[441],[442],[443],[444],[445],[446],[447],[448],[449],[450],[451],[452],[453],[454],[455],[456],[457],[458],[459],[460],[461],[462],[463],[464],[465],[466],[467],[468],[469],[470],[471],[472],[473],[474],[475],[476],[477],[478],[479],[480],[481],[482],[483],[484],[485],[486],[487],[488],[489],[490],[491],[492],[493],[494],[495],[496],[497],[498],[499],[500],[501],[502],[503],[504],[505],[506],[507],[508],[509],[510],[511],[512],[513],[514],[515],[516],[517],[518],[519],[520],[521],[522],[523],[524],[525],[526],[527],[528],[529],[530],[531],[532],[533],[534],[535],[536],[537],[538],[539],[540],[541],[542],[543],[544],[545],[546],[547],[548],[549],[550],[551],[552],[553],[554],[555],[556],[557],[558],[559],[560],[561],[562],[563],[564],[565],[566],[567],[568],[569],[570],[571],[572],[573],[574],[575],[576],[577],[578],[579],[580],[581],[582],[583],[584],[585],[586],[587],[588],[589],[590],[591],[592],[593],[594],[595],[596],[597],[598],[599],[600],[601],[602],[603],[604],[605],[606],[607],[608],[609],[610],[611],[612],[613],[614],[615],[616],[617],[618],[619],[620],[621],[622],[623],[624],[625],[626],[627],[628],[629],[630],[631],[632],[633],[634],[635],[636],[637],[638],[639],[640],[641],[642],[643],[644],[645],[646],[647],[648],[649],[650],[651],[652],[653],[654],[655],[656],[657],[658],[659],[660],[661],[662],[663],[664],[665],[666],[667],[668],[669],[670],[671],[672],[673],[674],[675],[676],[677],[678],[679],[680],[681],[682],[683],[684],[685],[686],[687],[688],[689],[690],[691],[692],[693],[694],[695],[696],[697],[698],[699],[700],[701],[702],[703],[704],[705],[706],[707],[708],[709],[710],[711],[712],[713],[714],[715],[716],[717],[718],[719],[720],[721],[722],[723],[724],[725],[726],[727],[728],[729],[730],[731],[732],[733],[734],[735],[736],[737],[738],[739],[740],[741],[742],[743],[744],[745],[746],[747],[748],[749],[750],[751],[752],[753],[754],[755],[756],[757],[758],[759],[760],[761],[762],[763],[764],[765],[766],[767],[768],[769],[770],[771],[772],[773],[774],[775],[776],[777],[778],[779],[780],[781],[782],[783],[784],[785],[786],[787],[788],[789],[790],[791],[792],[793],[794],[795],[796],[797],[798],[799],[800],[801],[802],[803],[804],[805],[806],[807],[808],[809],[810],[811],[812],[813],[814],[815],[816],[817],[818],[819],[820],[821],[822],[823],[824],[825],[826],[827],[828],[829],[830],[831],[832],[833],[834],[835],[836],[837],[838],[839],[840],[841],[842],[843],[844],[845],[846],[847],[848],[849],[850],[851],[852],[853],[854],[855],[856],[857],[858],[859],[860],[861],[862],[863],[864],[865],[866],[867],[868],[869],[870],[871],[872],[873],[874],[875],[876],[877],[878],[879],[880],[881],[882],[883],[884],[885],[886],[887],[888],[889],[890],[891],[892],[893],[894],[895],[896],[897],[898],[899],[900],[901],[902],[903],[904],[905],[906],[907],[908],[909],[910],[911],[912],[913],[914],[915],[916],[917],[918],[919],[920],[921],[922],[923],[924],[925],[926],[927],[928],[929],[930],[931],[932],[933],[934],[935],[936],[937],[938],[939],[940],[941],[942],[943],[944],[945],[946],[947],[948],[949],[950],[951],[952],[953],[954],[955],[956],[957],[958],[959],[960],[961],[962],[963],[964],[965],[966],[967],[968],[969],[970],[971],[972],[973],[974],[975],[976],[977],[978],[979],[980],[981],[982],[983],[984],[985],[986],[987],[988],[989],[990],[991],[992],[993],[994],[995],[996],[997],[998],[999],[1000],[1001],[1002],[1003],[1004],[1005],[1006],[1007],[1008],[1009],[1010],[1011],[1012],[1013],[1014],[1015],[1016],[1017],[1018],[1019],[1020],[1021],[1022],[1023],[1024],[1025],[1026],[1027],[1028],[1029],[1030],[1031],[1032],[1033],[1034],[1035],[1036],[1037],[1038],[1039],[1040],[1041],[1042],[1043],[1044],[1045],[1046],[1047],[1048],[1049],[1050],[1051],[1052],[1053],[1054],[1055],[1056],[1057],[1058],[1059],[1060],[1061],[1062],[1063],[1064],[1065],[1066],[1067],[1068],[1069],[1070],[1071],[1072],[1073],[1074],[1075],[1076],[1077],[1078],[1079],[1080],[1081],[1082],[1083],[1084],[1085],[1086],[1087],[1088],[1089],[1090],[1091],[1092],[1093],[1094],[1095],[1096],[1097],[1098],[1099],[1100]],[0],[0],[10,0],[34,0],[0],[0],[0],[10,0],[34,0],["0,0,20,34",""],["rect",""]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]]}};
;
// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @externs_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/maps/google_maps_api_v3.js
// ==/ClosureCompiler==

/**
 * @name CSS3 InfoBubble with tabs for Google Maps API V3
 * @version 0.8
 * @author Luke Mahe
 * @fileoverview
 * This library is a CSS Infobubble with tabs. It uses css3 rounded corners and
 * drop shadows and animations. It also allows tabs
 */

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * A CSS3 InfoBubble v0.8
 * @param {Object.<string, *>=} opt_options Optional properties to set.
 * @extends {google.maps.OverlayView}
 * @constructor
 */
function InfoBubble(opt_options) {
  this.extend(InfoBubble, google.maps.OverlayView);
  this.tabs_ = [];
  this.activeTab_ = null;
  this.baseZIndex_ = 100;
  this.isOpen_ = false;

  var options = opt_options || {};

  if (options['backgroundColor'] == undefined) {
    options['backgroundColor'] = this.BACKGROUND_COLOR_;
  }

  if (options['borderColor'] == undefined) {
    options['borderColor'] = this.BORDER_COLOR_;
  }

  if (options['borderRadius'] == undefined) {
    options['borderRadius'] = this.BORDER_RADIUS_;
  }

  if (options['borderWidth'] == undefined) {
    options['borderWidth'] = this.BORDER_WIDTH_;
  }

  if (options['padding'] == undefined) {
    options['padding'] = this.PADDING_;
  }

  if (options['arrowPosition'] == undefined) {
    options['arrowPosition'] = this.ARROW_POSITION_;
  }

  if (options['disableAutoPan'] == undefined) {
    options['disableAutoPan'] = false;
  }

  if (options['disableAnimation'] == undefined) {
    options['disableAnimation'] = false;
  }

  if (options['minWidth'] == undefined) {
    options['minWidth'] = this.MIN_WIDTH_;
  }

  if (options['shadowStyle'] == undefined) {
    options['shadowStyle'] = this.SHADOW_STYLE_;
  }

  if (options['arrowSize'] == undefined) {
    options['arrowSize'] = this.ARROW_SIZE_;
  }

  if (options['arrowStyle'] == undefined) {
    options['arrowStyle'] = this.ARROW_STYLE_;
  }

  this.buildDom_();

  this.setValues(options);
}
window['InfoBubble'] = InfoBubble;


/**
 * Default arrow size
 * @const
 * @private
 */
InfoBubble.prototype.ARROW_SIZE_ = 15;


/**
 * Default arrow style
 * @const
 * @private
 */
InfoBubble.prototype.ARROW_STYLE_ = 0;


/**
 * Default shadow style
 * @const
 * @private
 */
InfoBubble.prototype.SHADOW_STYLE_ = 1;


/**
 * Default min width
 * @const
 * @private
 */
InfoBubble.prototype.MIN_WIDTH_ = 50;


/**
 * Default arrow position
 * @const
 * @private
 */
InfoBubble.prototype.ARROW_POSITION_ = 50;


/**
 * Default padding
 * @const
 * @private
 */
InfoBubble.prototype.PADDING_ = 10;


/**
 * Default border width
 * @const
 * @private
 */
InfoBubble.prototype.BORDER_WIDTH_ = 1;


/**
 * Default border color
 * @const
 * @private
 */
InfoBubble.prototype.BORDER_COLOR_ = '#ccc';


/**
 * Default border radius
 * @const
 * @private
 */
InfoBubble.prototype.BORDER_RADIUS_ = 10;


/**
 * Default background color
 * @const
 * @private
 */
InfoBubble.prototype.BACKGROUND_COLOR_ = '#fff';


/**
 * Extends a objects prototype by anothers.
 *
 * @param {Object} obj1 The object to be extended.
 * @param {Object} obj2 The object to extend with.
 * @return {Object} The new extended object.
 * @ignore
 */
InfoBubble.prototype.extend = function(obj1, obj2) {
  return (function(object) {
    for (var property in object.prototype) {
      this.prototype[property] = object.prototype[property];
    }
    return this;
  }).apply(obj1, [obj2]);
};


/**
 * Builds the InfoBubble dom
 * @private
 */
InfoBubble.prototype.buildDom_ = function() {
  var bubble = this.bubble_ = document.createElement('DIV');
  bubble.style['position'] = 'absolute';
  bubble.style['zIndex'] = this.baseZIndex_;

  var tabsContainer = this.tabsContainer_ = document.createElement('DIV');
  tabsContainer.style['position'] = 'relative';

  // Close button
  var close = this.close_ = document.createElement('IMG');
  close.style['position'] = 'absolute';
  close.style['width'] = this.px(12);
  close.style['height'] = this.px(12);
  close.style['border'] = 0;
  close.style['zIndex'] = this.baseZIndex_ + 1;
  close.style['cursor'] = 'pointer';
  close.src = 'http://maps.gstatic.com/intl/en_us/mapfiles/iw_close.gif';

  var that = this;
  google.maps.event.addDomListener(close, 'click', function() {
    that.close();
    google.maps.event.trigger(that, 'closeclick');
  });

  // Content area
  var contentContainer = this.contentContainer_ = document.createElement('DIV');
  contentContainer.style['overflowX'] = 'auto';
  contentContainer.style['overflowY'] = 'auto';
  contentContainer.style['cursor'] = 'default';
  contentContainer.style['clear'] = 'both';
  contentContainer.style['position'] = 'relative';

  var content = this.content_ = document.createElement('DIV');
  contentContainer.appendChild(content);

  // Arrow
  var arrow = this.arrow_ = document.createElement('DIV');
  arrow.style['position'] = 'relative';

  var arrowOuter = this.arrowOuter_ = document.createElement('DIV');
  var arrowInner = this.arrowInner_ = document.createElement('DIV');

  var arrowSize = this.getArrowSize_();

  arrowOuter.style['position'] = arrowInner.style['position'] = 'absolute';
  arrowOuter.style['left'] = arrowInner.style['left'] = '50%';
  arrowOuter.style['height'] = arrowInner.style['height'] = '0';
  arrowOuter.style['width'] = arrowInner.style['width'] = '0';
  arrowOuter.style['marginLeft'] = this.px(-arrowSize);
  arrowOuter.style['borderWidth'] = this.px(arrowSize);
  arrowOuter.style['borderBottomWidth'] = 0;

  // Shadow
  var bubbleShadow = this.bubbleShadow_ = document.createElement('DIV');
  bubbleShadow.style['position'] = 'absolute';

  // Hide the InfoBubble by default
  bubble.style['display'] = bubbleShadow.style['display'] = 'none';

  bubble.appendChild(this.tabsContainer_);
  bubble.appendChild(close);
  bubble.appendChild(contentContainer);
  arrow.appendChild(arrowOuter);
  arrow.appendChild(arrowInner);
  bubble.appendChild(arrow);

  var stylesheet = document.createElement('style');
  stylesheet.setAttribute('type', 'text/css');

  /**
   * The animation for the infobubble
   * @type {string}
   */
  this.animationName_ = '_ibani_' + Math.round(Math.random() * 10000);

  var css = '.' + this.animationName_ + '{-webkit-animation-name:' +
      this.animationName_ + ';-webkit-animation-duration:0.5s;' +
      '-webkit-animation-iteration-count:1;}' +
      '@-webkit-keyframes ' + this.animationName_ + ' {from {' +
      '-webkit-transform: scale(0)}50% {-webkit-transform: scale(1.2)}90% ' +
      '{-webkit-transform: scale(0.95)}to {-webkit-transform: scale(1)}}';

  stylesheet.textContent = css;
  document.getElementsByTagName('head')[0].appendChild(stylesheet);
};


/**
 * Sets the background class name
 *
 * @param {string} className The class name to set.
 */
InfoBubble.prototype.setBackgroundClassName = function(className) {
  this.set('backgroundClassName', className);
};
InfoBubble.prototype['setBackgroundClassName'] =
    InfoBubble.prototype.setBackgroundClassName;


/**
 * changed MVC callback
 */
InfoBubble.prototype.backgroundClassName_changed = function() {
  this.content_.className = this.get('backgroundClassName');
};
InfoBubble.prototype['backgroundClassName_changed'] =
    InfoBubble.prototype.backgroundClassName_changed;


/**
 * Sets the class of the tab
 *
 * @param {string} className the class name to set.
 */
InfoBubble.prototype.setTabClassName = function(className) {
  this.set('tabClassName', className);
};
InfoBubble.prototype['setTabClassName'] =
    InfoBubble.prototype.setTabClassName;


/**
 * tabClassName changed MVC callback
 */
InfoBubble.prototype.tabClassName_changed = function() {
  this.updateTabStyles_();
};
InfoBubble.prototype['tabClassName_changed'] =
    InfoBubble.prototype.tabClassName_changed;


/**
 * Gets the style of the arrow
 *
 * @private
 * @return {number} The style of the arrow.
 */
InfoBubble.prototype.getArrowStyle_ = function() {
  return parseInt(this.get('arrowStyle'), 10) || 0;
};


/**
 * Sets the style of the arrow
 *
 * @param {number} style The style of the arrow.
 */
InfoBubble.prototype.setArrowStyle = function(style) {
  this.set('arrowStyle', style);
};
InfoBubble.prototype['setArrowStyle'] =
    InfoBubble.prototype.setArrowStyle;


/**
 * Arrow style changed MVC callback
 */
InfoBubble.prototype.arrowStyle_changed = function() {
  this.arrowSize_changed();
};
InfoBubble.prototype['arrowStyle_changed'] =
    InfoBubble.prototype.arrowStyle_changed;


/**
 * Gets the size of the arrow
 *
 * @private
 * @return {number} The size of the arrow.
 */
InfoBubble.prototype.getArrowSize_ = function() {
  return parseInt(this.get('arrowSize'), 10) || 0;
};


/**
 * Sets the size of the arrow
 *
 * @param {number} size The size of the arrow.
 */
InfoBubble.prototype.setArrowSize = function(size) {
  this.set('arrowSize', size);
};
InfoBubble.prototype['setArrowSize'] =
    InfoBubble.prototype.setArrowSize;


/**
 * Arrow size changed MVC callback
 */
InfoBubble.prototype.arrowSize_changed = function() {
  this.borderWidth_changed();
};
InfoBubble.prototype['arrowSize_changed'] =
    InfoBubble.prototype.arrowSize_changed;


/**
 * Set the position of the InfoBubble arrow
 *
 * @param {number} pos The position to set.
 */
InfoBubble.prototype.setArrowPosition = function(pos) {
  this.set('arrowPosition', pos);
};
InfoBubble.prototype['setArrowPosition'] =
    InfoBubble.prototype.setArrowPosition;


/**
 * Get the position of the InfoBubble arrow
 *
 * @private
 * @return {number} The position..
 */
InfoBubble.prototype.getArrowPosition_ = function() {
  return parseInt(this.get('arrowPosition'), 10) || 0;
};


/**
 * arrowPosition changed MVC callback
 */
InfoBubble.prototype.arrowPosition_changed = function() {
  var pos = this.getArrowPosition_();
  this.arrowOuter_.style['left'] = this.arrowInner_.style['left'] = pos + '%';

  this.redraw_();
};
InfoBubble.prototype['arrowPosition_changed'] =
    InfoBubble.prototype.arrowPosition_changed;


/**
 * Set the zIndex of the InfoBubble
 *
 * @param {number} zIndex The zIndex to set.
 */
InfoBubble.prototype.setZIndex = function(zIndex) {
  this.set('zIndex', zIndex);
};
InfoBubble.prototype['setZIndex'] = InfoBubble.prototype.setZIndex;


/**
 * Get the zIndex of the InfoBubble
 *
 * @return {number} The zIndex to set.
 */
InfoBubble.prototype.getZIndex = function() {
  return parseInt(this.get('zIndex'), 10) || this.baseZIndex_;
};


/**
 * zIndex changed MVC callback
 */
InfoBubble.prototype.zIndex_changed = function() {
  var zIndex = this.getZIndex();

  this.bubble_.style['zIndex'] = this.baseZIndex_ = zIndex;
  this.close_.style['zIndex'] = zIndex + 1;
};
InfoBubble.prototype['zIndex_changed'] = InfoBubble.prototype.zIndex_changed;


/**
 * Set the style of the shadow
 *
 * @param {number} shadowStyle The style of the shadow.
 */
InfoBubble.prototype.setShadowStyle = function(shadowStyle) {
  this.set('shadowStyle', shadowStyle);
};
InfoBubble.prototype['setShadowStyle'] = InfoBubble.prototype.setShadowStyle;


/**
 * Get the style of the shadow
 *
 * @private
 * @return {number} The style of the shadow.
 */
InfoBubble.prototype.getShadowStyle_ = function() {
  return parseInt(this.get('shadowStyle'), 10) || 0;
};


/**
 * shadowStyle changed MVC callback
 */
InfoBubble.prototype.shadowStyle_changed = function() {
  var shadowStyle = this.getShadowStyle_();

  var display = '';
  var shadow = '';
  var backgroundColor = '';
  switch (shadowStyle) {
    case 0:
      display = 'none';
      break;
    case 1:
      shadow = '35px 25px 8px rgba(33,33,33,0.3)';
      backgroundColor = 'transparent';
      break;
    case 2:
      shadow = '0 0 2px rgba(33,33,33,0.3)';
      backgroundColor = 'rgba(33,33,33,0.35)';
      break;
  }
  this.bubbleShadow_.style['boxShadow'] =
      this.bubbleShadow_.style['webkitBoxShadow'] =
      this.bubbleShadow_.style['MozBoxShadow'] = shadow;
  this.bubbleShadow_.style['backgroundColor'] = backgroundColor;
  if (this.isOpen_) {
    this.bubbleShadow_.style['display'] = display;
    this.draw();
  }
};
InfoBubble.prototype['shadowStyle_changed'] =
    InfoBubble.prototype.shadowStyle_changed;


/**
 * Show the close button
 */
InfoBubble.prototype.showCloseButton = function() {
  this.set('hideCloseButton', false);
};
InfoBubble.prototype['showCloseButton'] = InfoBubble.prototype.showCloseButton;


/**
 * Hide the close button
 */
InfoBubble.prototype.hideCloseButton = function() {
  this.set('hideCloseButton', true);
};
InfoBubble.prototype['hideCloseButton'] = InfoBubble.prototype.hideCloseButton;


/**
 * hideCloseButton changed MVC callback
 */
InfoBubble.prototype.hideCloseButton_changed = function() {
  this.close_.style['display'] = this.get('hideCloseButton') ? 'none' : '';
};
InfoBubble.prototype['hideCloseButton_changed'] =
    InfoBubble.prototype.hideCloseButton_changed;


/**
 * Set the background color
 *
 * @param {string} color The color to set.
 */
InfoBubble.prototype.setBackgroundColor = function(color) {
  if (color) {
    this.set('backgroundColor', color);
  }
};
InfoBubble.prototype['setBackgroundColor'] =
    InfoBubble.prototype.setBackgroundColor;


/**
 * backgroundColor changed MVC callback
 */
InfoBubble.prototype.backgroundColor_changed = function() {
  var backgroundColor = this.get('backgroundColor');
  this.contentContainer_.style['backgroundColor'] = backgroundColor;

  this.arrowInner_.style['borderColor'] = backgroundColor +
      ' transparent transparent';
  this.updateTabStyles_();
};
InfoBubble.prototype['backgroundColor_changed'] =
    InfoBubble.prototype.backgroundColor_changed;


/**
 * Set the border color
 *
 * @param {string} color The border color.
 */
InfoBubble.prototype.setBorderColor = function(color) {
  if (color) {
    this.set('borderColor', color);
  }
};
InfoBubble.prototype['setBorderColor'] = InfoBubble.prototype.setBorderColor;


/**
 * borderColor changed MVC callback
 */
InfoBubble.prototype.borderColor_changed = function() {
  var borderColor = this.get('borderColor');

  var contentContainer = this.contentContainer_;
  var arrowOuter = this.arrowOuter_;
  contentContainer.style['borderColor'] = borderColor;

  arrowOuter.style['borderColor'] = borderColor +
      ' transparent transparent';

  contentContainer.style['borderStyle'] =
      arrowOuter.style['borderStyle'] =
      this.arrowInner_.style['borderStyle'] = 'solid';

  this.updateTabStyles_();
};
InfoBubble.prototype['borderColor_changed'] =
    InfoBubble.prototype.borderColor_changed;


/**
 * Set the radius of the border
 *
 * @param {number} radius The radius of the border.
 */
InfoBubble.prototype.setBorderRadius = function(radius) {
  this.set('borderRadius', radius);
};
InfoBubble.prototype['setBorderRadius'] = InfoBubble.prototype.setBorderRadius;


/**
 * Get the radius of the border
 *
 * @private
 * @return {number} The radius of the border.
 */
InfoBubble.prototype.getBorderRadius_ = function() {
  return parseInt(this.get('borderRadius'), 10) || 0;
};


/**
 * borderRadius changed MVC callback
 */
InfoBubble.prototype.borderRadius_changed = function() {
  var borderRadius = this.getBorderRadius_();
  var borderWidth = this.getBorderWidth_();

  this.contentContainer_.style['borderRadius'] =
      this.contentContainer_.style['MozBorderRadius'] =
      this.contentContainer_.style['webkitBorderRadius'] =
      this.bubbleShadow_.style['borderRadius'] =
      this.bubbleShadow_.style['MozBorderRadius'] =
      this.bubbleShadow_.style['webkitBorderRadius'] = this.px(borderRadius);

  this.tabsContainer_.style['paddingLeft'] =
      this.tabsContainer_.style['paddingRight'] =
      this.px(borderRadius + borderWidth);

  this.redraw_();
};
InfoBubble.prototype['borderRadius_changed'] =
    InfoBubble.prototype.borderRadius_changed;


/**
 * Get the width of the border
 *
 * @private
 * @return {number} width The width of the border.
 */
InfoBubble.prototype.getBorderWidth_ = function() {
  return parseInt(this.get('borderWidth'), 10) || 0;
};


/**
 * Set the width of the border
 *
 * @param {number} width The width of the border.
 */
InfoBubble.prototype.setBorderWidth = function(width) {
  this.set('borderWidth', width);
};
InfoBubble.prototype['setBorderWidth'] = InfoBubble.prototype.setBorderWidth;


/**
 * borderWidth change MVC callback
 */
InfoBubble.prototype.borderWidth_changed = function() {
  var borderWidth = this.getBorderWidth_();

  this.contentContainer_.style['borderWidth'] = this.px(borderWidth);
  this.tabsContainer_.style['top'] = this.px(borderWidth);

  this.updateArrowStyle_();
  this.updateTabStyles_();
  this.borderRadius_changed();
  this.redraw_();
};
InfoBubble.prototype['borderWidth_changed'] =
    InfoBubble.prototype.borderWidth_changed;


/**
 * Update the arrow style
 * @private
 */
InfoBubble.prototype.updateArrowStyle_ = function() {
  var borderWidth = this.getBorderWidth_();
  var arrowSize = this.getArrowSize_();
  var arrowStyle = this.getArrowStyle_();
  var arrowOuterSizePx = this.px(arrowSize);
  var arrowInnerSizePx = this.px(Math.max(0, arrowSize - borderWidth));

  var outer = this.arrowOuter_;
  var inner = this.arrowInner_;

  this.arrow_.style['marginTop'] = this.px(-borderWidth);
  outer.style['borderTopWidth'] = arrowOuterSizePx;
  inner.style['borderTopWidth'] = arrowInnerSizePx;

  // Full arrow or arrow pointing to the left
  if (arrowStyle == 0 || arrowStyle == 1) {
    outer.style['borderLeftWidth'] = arrowOuterSizePx;
    inner.style['borderLeftWidth'] = arrowInnerSizePx;
  } else {
    outer.style['borderLeftWidth'] = inner.style['borderLeftWidth'] = 0;
  }

  // Full arrow or arrow pointing to the right
  if (arrowStyle == 0 || arrowStyle == 2) {
    outer.style['borderRightWidth'] = arrowOuterSizePx;
    inner.style['borderRightWidth'] = arrowInnerSizePx;
  } else {
    outer.style['borderRightWidth'] = inner.style['borderRightWidth'] = 0;
  }

  if (arrowStyle < 2) {
    outer.style['marginLeft'] = this.px(-(arrowSize));
    inner.style['marginLeft'] = this.px(-(arrowSize - borderWidth));
  } else {
    outer.style['marginLeft'] = inner.style['marginLeft'] = 0;
  }

  // If there is no border then don't show thw outer arrow
  if (borderWidth == 0) {
    outer.style['display'] = 'none';
  } else {
    outer.style['display'] = '';
  }
};


/**
 * Set the padding of the InfoBubble
 *
 * @param {number} padding The padding to apply.
 */
InfoBubble.prototype.setPadding = function(padding) {
  this.set('padding', padding);
};
InfoBubble.prototype['setPadding'] = InfoBubble.prototype.setPadding;


/**
 * Set the padding of the InfoBubble
 *
 * @private
 * @return {number} padding The padding to apply.
 */
InfoBubble.prototype.getPadding_ = function() {
  return parseInt(this.get('padding'), 10) || 0;
};


/**
 * padding changed MVC callback
 */
InfoBubble.prototype.padding_changed = function() {
  var padding = this.getPadding_();
  this.contentContainer_.style['padding'] = this.px(padding);
  this.updateTabStyles_();

  this.redraw_();
};
InfoBubble.prototype['padding_changed'] = InfoBubble.prototype.padding_changed;


/**
 * Add px extention to the number
 *
 * @param {number} num The number to wrap.
 * @return {string|number} A wrapped number.
 */
InfoBubble.prototype.px = function(num) {
  if (num) {
    // 0 doesn't need to be wrapped
    return num + 'px';
  }
  return num;
};


/**
 * Add events to stop propagation
 * @private
 */
InfoBubble.prototype.addEvents_ = function() {
  // We want to cancel all the events so they do not go to the map
  var events = ['mousedown', 'mousemove', 'mouseover', 'mouseout', 'mouseup',
      'mousewheel', 'DOMMouseScroll', 'touchstart', 'touchend', 'touchmove',
      'dblclick', 'contextmenu', 'click'];

  var bubble = this.bubble_;
  this.listeners_ = [];
  for (var i = 0, event; event = events[i]; i++) {
    this.listeners_.push(
      google.maps.event.addDomListener(bubble, event, function(e) {
        e.cancelBubble = true;
        if (e.stopPropagation) {
          e.stopPropagation();
        }
      })
    );
  }
};


/**
 * On Adding the InfoBubble to a map
 * Implementing the OverlayView interface
 */
InfoBubble.prototype.onAdd = function() {
  if (!this.bubble_) {
    this.buildDom_();
  }

  this.addEvents_();

  var panes = this.getPanes();
  if (panes) {
    panes.floatPane.appendChild(this.bubble_);
    panes.floatShadow.appendChild(this.bubbleShadow_);
  }
};
InfoBubble.prototype['onAdd'] = InfoBubble.prototype.onAdd;


/**
 * Draw the InfoBubble
 * Implementing the OverlayView interface
 */
InfoBubble.prototype.draw = function() {
  var projection = this.getProjection();

  if (!projection) {
    // The map projection is not ready yet so do nothing
    return;
  }

  var latLng = /** @type {google.maps.LatLng} */ (this.get('position'));

  if (!latLng) {
    this.close();
    return;
  }

  var tabHeight = 0;

  if (this.activeTab_) {
    tabHeight = this.activeTab_.offsetHeight;
  }

  var anchorHeight = this.getAnchorHeight_();
  var arrowSize = this.getArrowSize_();
  var arrowPosition = this.getArrowPosition_();

  arrowPosition = arrowPosition / 100;

  var pos = projection.fromLatLngToDivPixel(latLng);
  var width = this.contentContainer_.offsetWidth;
  var height = this.bubble_.offsetHeight;

  if (!width) {
    return;
  }

  // Adjust for the height of the info bubble
  var top = pos.y - (height + arrowSize);

  if (anchorHeight) {
    // If there is an anchor then include the height
    top -= anchorHeight;
  }

  var left = pos.x - (width * arrowPosition);

  this.bubble_.style['top'] = this.px(top);
  this.bubble_.style['left'] = this.px(left);

  var shadowStyle = parseInt(this.get('shadowStyle'), 10);

  switch (shadowStyle) {
    case 1:
      // Shadow is behind
      this.bubbleShadow_.style['top'] = this.px(top + tabHeight - 1);
      this.bubbleShadow_.style['left'] = this.px(left);
      this.bubbleShadow_.style['width'] = this.px(width);
      this.bubbleShadow_.style['height'] =
          this.px(this.contentContainer_.offsetHeight - arrowSize);
      break;
    case 2:
      // Shadow is below
      width = width * 0.8;
      if (anchorHeight) {
        this.bubbleShadow_.style['top'] = this.px(pos.y);
      } else {
        this.bubbleShadow_.style['top'] = this.px(pos.y + arrowSize);
      }
      this.bubbleShadow_.style['left'] = this.px(pos.x - width * arrowPosition);

      this.bubbleShadow_.style['width'] = this.px(width);
      this.bubbleShadow_.style['height'] = this.px(2);
      break;
  }
};
InfoBubble.prototype['draw'] = InfoBubble.prototype.draw;


/**
 * Removing the InfoBubble from a map
 */
InfoBubble.prototype.onRemove = function() {
  if (this.bubble_ && this.bubble_.parentNode) {
    this.bubble_.parentNode.removeChild(this.bubble_);
  }
  if (this.bubbleShadow_ && this.bubbleShadow_.parentNode) {
    this.bubbleShadow_.parentNode.removeChild(this.bubbleShadow_);
  }

  for (var i = 0, listener; listener = this.listeners_[i]; i++) {
    google.maps.event.removeListener(listener);
  }
};
InfoBubble.prototype['onRemove'] = InfoBubble.prototype.onRemove;


/**
 * Is the InfoBubble open
 *
 * @return {boolean} If the InfoBubble is open.
 */
InfoBubble.prototype.isOpen = function() {
  return this.isOpen_;
};
InfoBubble.prototype['isOpen'] = InfoBubble.prototype.isOpen;


/**
 * Close the InfoBubble
 */
InfoBubble.prototype.close = function() {
  if (this.bubble_) {
    this.bubble_.style['display'] = 'none';
    // Remove the animation so we next time it opens it will animate again
    this.bubble_.className =
        this.bubble_.className.replace(this.animationName_, '');
  }

  if (this.bubbleShadow_) {
    this.bubbleShadow_.style['display'] = 'none';
    this.bubbleShadow_.className =
        this.bubbleShadow_.className.replace(this.animationName_, '');
  }
  this.isOpen_ = false;
};
InfoBubble.prototype['close'] = InfoBubble.prototype.close;


/**
 * Open the InfoBubble (asynchronous).
 *
 * @param {google.maps.Map=} opt_map Optional map to open on.
 * @param {google.maps.MVCObject=} opt_anchor Optional anchor to position at.
 */
InfoBubble.prototype.open = function(opt_map, opt_anchor) {
  var that = this;
  window.setTimeout(function() {
    that.open_(opt_map, opt_anchor);
  }, 0);
};

/**
 * Open the InfoBubble
 * @private
 * @param {google.maps.Map=} opt_map Optional map to open on.
 * @param {google.maps.MVCObject=} opt_anchor Optional anchor to position at.
 */
InfoBubble.prototype.open_ = function(opt_map, opt_anchor) {
  this.updateContent_();

  if (opt_map) {
    this.setMap(opt_map);
  }

  if (opt_anchor) {
    this.set('anchor', opt_anchor);
    this.bindTo('anchorPoint', opt_anchor);
    this.bindTo('position', opt_anchor);
  }

  // Show the bubble and the show
  this.bubble_.style['display'] = this.bubbleShadow_.style['display'] = '';
  var animation = !this.get('disableAnimation');

  if (animation) {
    // Add the animation
    this.bubble_.className += ' ' + this.animationName_;
    this.bubbleShadow_.className += ' ' + this.animationName_;
  }

  this.redraw_();
  this.isOpen_ = true;

  var pan = !this.get('disableAutoPan');
  if (pan) {
    var that = this;
    window.setTimeout(function() {
      // Pan into view, done in a time out to make it feel nicer :)
      that.panToView();
    }, 200);
  }
};
InfoBubble.prototype['open'] = InfoBubble.prototype.open;


/**
 * Set the position of the InfoBubble
 *
 * @param {google.maps.LatLng} position The position to set.
 */
InfoBubble.prototype.setPosition = function(position) {
  if (position) {
    this.set('position', position);
  }
};
InfoBubble.prototype['setPosition'] = InfoBubble.prototype.setPosition;


/**
 * Returns the position of the InfoBubble
 *
 * @return {google.maps.LatLng} the position.
 */
InfoBubble.prototype.getPosition = function() {
  return /** @type {google.maps.LatLng} */ (this.get('position'));
};
InfoBubble.prototype['getPosition'] = InfoBubble.prototype.getPosition;


/**
 * position changed MVC callback
 */
InfoBubble.prototype.position_changed = function() {
  this.draw();
};
InfoBubble.prototype['position_changed'] =
    InfoBubble.prototype.position_changed;


/**
 * Pan the InfoBubble into view
 */
InfoBubble.prototype.panToView = function() {
  var projection = this.getProjection();

  if (!projection) {
    // The map projection is not ready yet so do nothing
    return;
  }

  if (!this.bubble_) {
    // No Bubble yet so do nothing
    return;
  }

  var anchorHeight = this.getAnchorHeight_();
  var height = this.bubble_.offsetHeight + anchorHeight;
  var map = this.get('map');
  var mapDiv = map.getDiv();
  var mapHeight = mapDiv.offsetHeight;

  var latLng = this.getPosition();
  var centerPos = projection.fromLatLngToContainerPixel(map.getCenter());
  var pos = projection.fromLatLngToContainerPixel(latLng);

  // Find out how much space at the top is free
  var spaceTop = centerPos.y - height;

  // Fine out how much space at the bottom is free
  var spaceBottom = mapHeight - centerPos.y;

  var needsTop = spaceTop < 0;
  var deltaY = 0;

  if (needsTop) {
    spaceTop *= -1;
    deltaY = (spaceTop + spaceBottom) / 2;
  }

  pos.y -= deltaY;
  latLng = projection.fromContainerPixelToLatLng(pos);

  if (map.getCenter() != latLng) {
    map.panTo(latLng);
  }
};
InfoBubble.prototype['panToView'] = InfoBubble.prototype.panToView;


/**
 * Converts a HTML string to a document fragment.
 *
 * @param {string} htmlString The HTML string to convert.
 * @return {Node} A HTML document fragment.
 * @private
 */
InfoBubble.prototype.htmlToDocumentFragment_ = function(htmlString) {
  htmlString = htmlString.replace(/^\s*([\S\s]*)\b\s*$/, '$1');
  var tempDiv = document.createElement('DIV');
  tempDiv.innerHTML = htmlString;
  if (tempDiv.childNodes.length == 1) {
    return /** @type {!Node} */ (tempDiv.removeChild(tempDiv.firstChild));
  } else {
    var fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    return fragment;
  }
};


/**
 * Removes all children from the node.
 *
 * @param {Node} node The node to remove all children from.
 * @private
 */
InfoBubble.prototype.removeChildren_ = function(node) {
  if (!node) {
    return;
  }

  var child;
  while (child = node.firstChild) {
    node.removeChild(child);
  }
};


/**
 * Sets the content of the infobubble.
 *
 * @param {string|Node} content The content to set.
 */
InfoBubble.prototype.setContent = function(content) {
  this.set('content', content);
};
InfoBubble.prototype['setContent'] = InfoBubble.prototype.setContent;


/**
 * Get the content of the infobubble.
 *
 * @return {string|Node} The marker content.
 */
InfoBubble.prototype.getContent = function() {
  return /** @type {Node|string} */ (this.get('content'));
};
InfoBubble.prototype['getContent'] = InfoBubble.prototype.getContent;


/**
 * Sets the marker content and adds loading events to images
 */
InfoBubble.prototype.updateContent_ = function() {
  if (!this.content_) {
    // The Content area doesnt exist.
    return;
  }

  this.removeChildren_(this.content_);
  var content = this.getContent();
  if (content) {
    if (typeof content == 'string') {
      content = this.htmlToDocumentFragment_(content);
    }
    this.content_.appendChild(content);

    var that = this;
    var images = this.content_.getElementsByTagName('IMG');
    for (var i = 0, image; image = images[i]; i++) {
      // Because we don't know the size of an image till it loads, add a
      // listener to the image load so the marker can resize and reposition
      // itself to be the correct height.
      google.maps.event.addDomListener(image, 'load', function() {
        that.imageLoaded_();
      });
    }
    google.maps.event.trigger(this, 'domready');
  }
  this.redraw_();
};

/**
 * Image loaded
 * @private
 */
InfoBubble.prototype.imageLoaded_ = function() {
  var pan = !this.get('disableAutoPan');
  this.redraw_();
  if (pan && (this.tabs_.length == 0 || this.activeTab_.index == 0)) {
    this.panToView();
  }
};

/**
 * Updates the styles of the tabs
 * @private
 */
InfoBubble.prototype.updateTabStyles_ = function() {
  if (this.tabs_ && this.tabs_.length) {
    for (var i = 0, tab; tab = this.tabs_[i]; i++) {
      this.setTabStyle_(tab.tab);
    }
    this.activeTab_.style['zIndex'] = this.baseZIndex_;
    var borderWidth = this.getBorderWidth_();
    var padding = this.getPadding_() / 2;
    this.activeTab_.style['borderBottomWidth'] = 0;
    this.activeTab_.style['paddingBottom'] = this.px(padding + borderWidth);
  }
};


/**
 * Sets the style of a tab
 * @private
 * @param {Element} tab The tab to style.
 */
InfoBubble.prototype.setTabStyle_ = function(tab) {
  var backgroundColor = this.get('backgroundColor');
  var borderColor = this.get('borderColor');
  var borderRadius = this.getBorderRadius_();
  var borderWidth = this.getBorderWidth_();
  var padding = this.getPadding_();

  var marginRight = this.px(-(Math.max(padding, borderRadius)));
  var borderRadiusPx = this.px(borderRadius);

  var index = this.baseZIndex_;
  if (tab.index) {
    index -= tab.index;
  }

  // The styles for the tab
  var styles = {
    'cssFloat': 'left',
    'position': 'relative',
    'cursor': 'pointer',
    'backgroundColor': backgroundColor,
    'border': this.px(borderWidth) + ' solid ' + borderColor,
    'padding': this.px(padding / 2) + ' ' + this.px(padding),
    'marginRight': marginRight,
    'whiteSpace': 'nowrap',
    'borderRadiusTopLeft': borderRadiusPx,
    'MozBorderRadiusTopleft': borderRadiusPx,
    'webkitBorderTopLeftRadius': borderRadiusPx,
    'borderRadiusTopRight': borderRadiusPx,
    'MozBorderRadiusTopright': borderRadiusPx,
    'webkitBorderTopRightRadius': borderRadiusPx,
    'zIndex': index,
    'display': 'inline'
  };

  for (var style in styles) {
    tab.style[style] = styles[style];
  }

  var className = this.get('tabClassName');
  if (className != undefined) {
    tab.className += ' ' + className;
  }
};


/**
 * Add user actions to a tab
 * @private
 * @param {Object} tab The tab to add the actions to.
 */
InfoBubble.prototype.addTabActions_ = function(tab) {
  var that = this;
  tab.listener_ = google.maps.event.addDomListener(tab, 'click', function() {
    that.setTabActive_(this);
  });
};


/**
 * Set a tab at a index to be active
 *
 * @param {number} index The index of the tab.
 */
InfoBubble.prototype.setTabActive = function(index) {
  var tab = this.tabs_[index - 1];

  if (tab) {
    this.setTabActive_(tab.tab);
  }
};
InfoBubble.prototype['setTabActive'] = InfoBubble.prototype.setTabActive;


/**
 * Set a tab to be active
 * @private
 * @param {Object} tab The tab to set active.
 */
InfoBubble.prototype.setTabActive_ = function(tab) {
  if (!tab) {
    this.setContent('');
    this.updateContent_();
    return;
  }

  var padding = this.getPadding_() / 2;
  var borderWidth = this.getBorderWidth_();

  if (this.activeTab_) {
    var activeTab = this.activeTab_;
    activeTab.style['zIndex'] = this.baseZIndex_ - activeTab.index;
    activeTab.style['paddingBottom'] = this.px(padding);
    activeTab.style['borderBottomWidth'] = this.px(borderWidth);
  }

  tab.style['zIndex'] = this.baseZIndex_;
  tab.style['borderBottomWidth'] = 0;
  tab.style['marginBottomWidth'] = '-10px';
  tab.style['paddingBottom'] = this.px(padding + borderWidth);

  this.setContent(this.tabs_[tab.index].content);
  this.updateContent_();

  this.activeTab_ = tab;

  this.redraw_();
};


/**
 * Set the max width of the InfoBubble
 *
 * @param {number} width The max width.
 */
InfoBubble.prototype.setMaxWidth = function(width) {
  this.set('maxWidth', width);
};
InfoBubble.prototype['setMaxWidth'] = InfoBubble.prototype.setMaxWidth;


/**
 * maxWidth changed MVC callback
 */
InfoBubble.prototype.maxWidth_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['maxWidth_changed'] =
    InfoBubble.prototype.maxWidth_changed;


/**
 * Set the max height of the InfoBubble
 *
 * @param {number} height The max height.
 */
InfoBubble.prototype.setMaxHeight = function(height) {
  this.set('maxHeight', height);
};
InfoBubble.prototype['setMaxHeight'] = InfoBubble.prototype.setMaxHeight;


/**
 * maxHeight changed MVC callback
 */
InfoBubble.prototype.maxHeight_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['maxHeight_changed'] =
    InfoBubble.prototype.maxHeight_changed;


/**
 * Set the min width of the InfoBubble
 *
 * @param {number} width The min width.
 */
InfoBubble.prototype.setMinWidth = function(width) {
  this.set('minWidth', width);
};
InfoBubble.prototype['setMinWidth'] = InfoBubble.prototype.setMinWidth;


/**
 * minWidth changed MVC callback
 */
InfoBubble.prototype.minWidth_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['minWidth_changed'] =
    InfoBubble.prototype.minWidth_changed;


/**
 * Set the min height of the InfoBubble
 *
 * @param {number} height The min height.
 */
InfoBubble.prototype.setMinHeight = function(height) {
  this.set('minHeight', height);
};
InfoBubble.prototype['setMinHeight'] = InfoBubble.prototype.setMinHeight;


/**
 * minHeight changed MVC callback
 */
InfoBubble.prototype.minHeight_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['minHeight_changed'] =
    InfoBubble.prototype.minHeight_changed;


/**
 * Add a tab
 *
 * @param {string} label The label of the tab.
 * @param {string|Element} content The content of the tab.
 */
InfoBubble.prototype.addTab = function(label, content) {
  var tab = document.createElement('DIV');
  tab.innerHTML = label;

  this.setTabStyle_(tab);
  this.addTabActions_(tab);

  this.tabsContainer_.appendChild(tab);

  this.tabs_.push({
    label: label,
    content: content,
    tab: tab
  });

  tab.index = this.tabs_.length - 1;
  tab.style['zIndex'] = this.baseZIndex_ - tab.index;

  if (!this.activeTab_) {
    this.setTabActive_(tab);
  }

  tab.className = tab.className + ' ' + this.animationName_;

  this.redraw_();
};
InfoBubble.prototype['addTab'] = InfoBubble.prototype.addTab;

/**
 * Update a tab at a speicifc index
 *
 * @param {number} index The index of the tab.
 * @param {?string} opt_label The label to change to.
 * @param {?string} opt_content The content to update to.
 */
InfoBubble.prototype.updateTab = function(index, opt_label, opt_content) {
  if (!this.tabs_.length || index < 0 || index >= this.tabs_.length) {
    return;
  }

  var tab = this.tabs_[index];
  if (opt_label != undefined) {
    tab.tab.innerHTML = tab.label = opt_label;
  }

  if (opt_content != undefined) {
    tab.content = opt_content;
  }

  if (this.activeTab_ == tab.tab) {
    this.setContent(tab.content);
    this.updateContent_();
  }
  this.redraw_();
};
InfoBubble.prototype['updateTab'] = InfoBubble.prototype.updateTab;


/**
 * Remove a tab at a specific index
 *
 * @param {number} index The index of the tab to remove.
 */
InfoBubble.prototype.removeTab = function(index) {
  if (!this.tabs_.length || index < 0 || index >= this.tabs_.length) {
    return;
  }

  var tab = this.tabs_[index];
  tab.tab.parentNode.removeChild(tab.tab);

  google.maps.event.removeListener(tab.tab.listener_);

  this.tabs_.splice(index, 1);

  delete tab;

  for (var i = 0, t; t = this.tabs_[i]; i++) {
    t.tab.index = i;
  }

  if (tab.tab == this.activeTab_) {
    // Removing the current active tab
    if (this.tabs_[index]) {
      // Show the tab to the right
      this.activeTab_ = this.tabs_[index].tab;
    } else if (this.tabs_[index - 1]) {
      // Show a tab to the left
      this.activeTab_ = this.tabs_[index - 1].tab;
    } else {
      // No tabs left to sho
      this.activeTab_ = undefined;
    }

    this.setTabActive_(this.activeTab_);
  }

  this.redraw_();
};
InfoBubble.prototype['removeTab'] = InfoBubble.prototype.removeTab;


/**
 * Get the size of an element
 * @private
 * @param {Node|string} element The element to size.
 * @param {number=} opt_maxWidth Optional max width of the element.
 * @param {number=} opt_maxHeight Optional max height of the element.
 * @return {google.maps.Size} The size of the element.
 */
InfoBubble.prototype.getElementSize_ = function(element, opt_maxWidth,
                                                opt_maxHeight) {
  var sizer = document.createElement('DIV');
  sizer.style['display'] = 'inline';
  sizer.style['position'] = 'absolute';
  sizer.style['visibility'] = 'hidden';

  if (typeof element == 'string') {
    sizer.innerHTML = element;
  } else {
    sizer.appendChild(element.cloneNode(true));
  }

  document.body.appendChild(sizer);
  var size = new google.maps.Size(sizer.offsetWidth, sizer.offsetHeight);

  // If the width is bigger than the max width then set the width and size again
  if (opt_maxWidth && size.width > opt_maxWidth) {
    sizer.style['width'] = this.px(opt_maxWidth);
    size = new google.maps.Size(sizer.offsetWidth, sizer.offsetHeight);
  }

  // If the height is bigger than the max height then set the height and size
  // again
  if (opt_maxHeight && size.height > opt_maxHeight) {
    sizer.style['height'] = this.px(opt_maxHeight);
    size = new google.maps.Size(sizer.offsetWidth, sizer.offsetHeight);
  }

  document.body.removeChild(sizer);
  delete sizer;
  return size;
};


/**
 * Redraw the InfoBubble
 * @private
 */
InfoBubble.prototype.redraw_ = function() {
  this.figureOutSize_();
  this.positionCloseButton_();
  this.draw();
};


/**
 * Figure out the optimum size of the InfoBubble
 * @private
 */
InfoBubble.prototype.figureOutSize_ = function() {
  var map = this.get('map');

  if (!map) {
    return;
  }

  var padding = this.getPadding_();
  var borderWidth = this.getBorderWidth_();
  var borderRadius = this.getBorderRadius_();
  var arrowSize = this.getArrowSize_();

  var mapDiv = map.getDiv();
  var gutter = arrowSize * 2;
  var mapWidth = mapDiv.offsetWidth - gutter;
  var mapHeight = mapDiv.offsetHeight - gutter - this.getAnchorHeight_();
  var tabHeight = 0;
  var width = /** @type {number} */ (this.get('minWidth') || 0);
  var height = /** @type {number} */ (this.get('minHeight') || 0);
  var maxWidth = /** @type {number} */ (this.get('maxWidth') || 0);
  var maxHeight = /** @type {number} */ (this.get('maxHeight') || 0);

  maxWidth = Math.min(mapWidth, maxWidth);
  maxHeight = Math.min(mapHeight, maxHeight);

  var tabWidth = 0;
  if (this.tabs_.length) {
    // If there are tabs then you need to check the size of each tab's content
    for (var i = 0, tab; tab = this.tabs_[i]; i++) {
      var tabSize = this.getElementSize_(tab.tab, maxWidth, maxHeight);
      var contentSize = this.getElementSize_(tab.content, maxWidth, maxHeight);

      if (width < tabSize.width) {
        width = tabSize.width;
      }

      // Add up all the tab widths because they might end up being wider than
      // the content
      tabWidth += tabSize.width;

      if (height < tabSize.height) {
        height = tabSize.height;
      }

      if (tabSize.height > tabHeight) {
        tabHeight = tabSize.height;
      }

      if (width < contentSize.width) {
        width = contentSize.width;
      }

      if (height < contentSize.height) {
        height = contentSize.height;
      }
    }
  } else {
    var content = /** @type {string|Node} */ (this.get('content'));
    if (typeof content == 'string') {
      content = this.htmlToDocumentFragment_(content);
    }
    if (content) {
      var contentSize = this.getElementSize_(content, maxWidth, maxHeight);

      if (width < contentSize.width) {
        width = contentSize.width;
      }

      if (height < contentSize.height) {
        height = contentSize.height;
      }
    }
  }

  if (maxWidth) {
    width = Math.min(width, maxWidth);
  }

  if (maxHeight) {
    height = Math.min(height, maxHeight);
  }

  width = Math.max(width, tabWidth);

  if (width == tabWidth) {
    width = width + 2 * padding;
  }

  arrowSize = arrowSize * 2;
  width = Math.max(width, arrowSize);

  // Maybe add this as a option so they can go bigger than the map if the user
  // wants
  if (width > mapWidth) {
    width = mapWidth;
  }

  if (height > mapHeight) {
    height = mapHeight - tabHeight;
  }

  if (this.tabsContainer_) {
    this.tabHeight_ = tabHeight;
    this.tabsContainer_.style['width'] = this.px(tabWidth);
  }

  this.contentContainer_.style['width'] = this.px(width);
  this.contentContainer_.style['height'] = this.px(height);
};


/**
 *  Get the height of the anchor
 *
 *  This function is a hack for now and doesn't really work that good, need to
 *  wait for pixelBounds to be correctly exposed.
 *  @private
 *  @return {number} The height of the anchor.
 */
InfoBubble.prototype.getAnchorHeight_ = function() {
  var anchor = this.get('anchor');
  if (anchor) {
    var anchorPoint = /** @type google.maps.Point */(this.get('anchorPoint'));

    if (anchorPoint) {
      return -1 * anchorPoint.y;
    }
  }
  return 0;
};

InfoBubble.prototype.anchorPoint_changed = function() {
  this.draw();
};
InfoBubble.prototype['anchorPoint_changed'] = InfoBubble.prototype.anchorPoint_changed;


/**
 * Position the close button in the right spot.
 * @private
 */
InfoBubble.prototype.positionCloseButton_ = function() {
  var br = this.getBorderRadius_();
  var bw = this.getBorderWidth_();

  var right = 2;
  var top = 2;

  if (this.tabs_.length && this.tabHeight_) {
    top += this.tabHeight_;
  }

  top += bw;
  right += bw;

  var c = this.contentContainer_;
  if (c && c.clientHeight < c.scrollHeight) {
    // If there are scrollbars then move the cross in so it is not over
    // scrollbar
    right += 15;
  }

  this.close_.style['right'] = this.px(right);
  this.close_.style['top'] = this.px(top);
};
;
/**
 * @file
 * @author https://drupal.org/user/2210776
 * @copyright GNU GPL
 * Adds new methods to the Infobubble.prototype class.
 * Adapted from the gmap_style_bubbles module.
 * See https://drupal.org/node/2035847
 */

if (typeof InfoBubble === 'function') {
  /* First new method: bubbleBackgroundClassName allows theming of the whole
     popup bubble via css. */
  InfoBubble.prototype.setBubbleBackgroundClassName = function(className) {
    this.contentContainer_.classList.add(className);
  };
  InfoBubble.prototype['setBubbleBackgroundClassName'] =
    InfoBubble.prototype.setBubbleBackgroundClassName;

  /* Second new method: closeImage allows reference to a custom image to
     close the popup window. */
  InfoBubble.prototype.setCloseImage = function(image) {
    this.close_.src = image;
  };
  InfoBubble.prototype['setCloseImage'] =
    InfoBubble.prototype.setCloseImage;

  /* Third new method: closePosition allows you to set the position to something
     other than absolute. */
  InfoBubble.prototype.setClosePosition = function(position) {
    this.close_.style['position'] = position;
  };
  InfoBubble.prototype['setClosePosition'] =
    InfoBubble.prototype.setClosePosition;

  /* Fourth new method: closeWidth allows you to specify a custom close image width */
  InfoBubble.prototype.setCloseWidth = function(width) {
    this.close_.style['width'] = width;
  };
  InfoBubble.prototype['setCloseWidth'] =
    InfoBubble.prototype.setCloseWidth;

  /* Fifth new method: closeHeight allows you to specify a custom close image height */
  InfoBubble.prototype.setCloseHeight = function(height) {
    this.close_.style['height'] = height;
  };
  InfoBubble.prototype['setCloseHeight'] =
    InfoBubble.prototype.setCloseHeight;

  /* Sixth new method: closeBorder allows you to add a border to the close image. */
  InfoBubble.prototype.setCloseBorder = function(border) {
    this.close_.style['border'] = border;
  };
  InfoBubble.prototype['setCloseBorder'] =
    InfoBubble.prototype.setCloseBorder;

  /* Seventh new method: closeZIndex allows you to set a custom zindex for your
     close image. */
  InfoBubble.prototype.setCloseZIndex = function(zIndex) {
    this.close_.style['zIndex'] = zIndex;
  };
  InfoBubble.prototype['setCloseZIndex'] =
    InfoBubble.prototype.setCloseZIndex;

  /* Eighth new method: closeCursor allows you change what your cursor turns
     into on hovering on the close image. */
  InfoBubble.prototype.setCloseCursor = function(cursor) {
    this.close_.style['cursor'] = cursor;
  };
  InfoBubble.prototype['setCloseCursor'] =
    InfoBubble.prototype.setCloseCursor;
}
;

/**
 * @file
 * getlocations.js
 * @author Bob Hutchinson http://drupal.org/user/52366
 * @copyright GNU GPL
 *
 * Javascript functions for getlocations module for Drupal 7
 * this is for googlemaps API version 3
*/

(function ($) {

  Drupal.getlocations_inputmap = [];
  Drupal.getlocations_pano = [];
  Drupal.getlocations_data = [];
  Drupal.getlocations_markers = [];
  Drupal.getlocations_settings = [];
  Drupal.getlocations_map = [];

  // in icons.js
  Drupal.getlocations.iconSetup();

  Drupal.behaviors.getlocations = {
    attach: function(context, settings) {

      // work over all class 'getlocations_map_canvas'
      $(".getlocations_map_canvas", context).once('getlocations-map-processed', function(index, element) {
        var elemID = $(element).attr('id');
        var key = elemID.replace(/^getlocations_map_canvas_/, '');
        // is there really a map?
        if ( $("#getlocations_map_canvas_" + key).is('div') ) {

          // defaults
          var global_settings = {
            maxzoom: 16,
            minzoom: 7,
            nodezoom: 12,
            minzoom_map: -1,
            maxzoom_map: -1,
            mgr: '',
            cmgr: '',
            cmgr_gridSize: null,
            cmgr_maxZoom: null,
            cmgr_minClusterSize: null,
            cmgr_styles: '',
            cmgr_style: null,
            defaultIcon: '',
            useInfoBubble: false,
            useInfoWindow: false,
            useCustomContent: false,
            useLink: false,
            markeraction: 0,
            markeractiontype: 1,
            markeraction_click_zoom: -1,
            markeraction_click_center: 0,
            show_maplinks: false,
            show_maplinks_viewport: false,
            show_bubble_on_one_marker: false,
            infoBubbles: [],
            datanum: 0,
            batchr: []
          };

          var setting = settings.getlocations[key];
          var lat = parseFloat(setting.lat);
          var lng = parseFloat(setting.lng);

          var selzoom = parseInt(setting.zoom);
          var controltype = setting.controltype;
          var pancontrol = setting.pancontrol;
          var scale = setting.scale;
          var overview = setting.overview;
          var overview_opened = setting.overview_opened;
          var sv_show = setting.sv_show;
          var scrollw = setting.scrollwheel;
          var maptype = (setting.maptype ? setting.maptype : '');
          var baselayers = (setting.baselayers ? setting.baselayers : '');
          var map_marker = setting.map_marker;
          var poi_show = setting.poi_show;
          var transit_show = setting.transit_show;
          var pansetting = setting.pansetting;
          var draggable = setting.draggable;
          var map_styles = setting.styles;
          var map_backgroundcolor = setting.map_backgroundcolor;
          var fullscreen = (setting.fullscreen ? true : false);
          if (setting.is_mobile && setting.fullscreen_disable) {
            fullscreen = false;
          }
          var js_path = setting.js_path;
          var useOpenStreetMap = false;
          var nokeyboard = (setting.nokeyboard ? true : false);
          var nodoubleclickzoom = (setting.nodoubleclickzoom ? true : false);
          var pancontrolposition = setting.pancontrolposition;
          var mapcontrolposition = setting.mapcontrolposition;
          var zoomcontrolposition = setting.zoomcontrolposition;
          var scalecontrolposition = setting.scalecontrolposition;
          var svcontrolposition = setting.svcontrolposition;
          var fullscreen_controlposition = setting.fullscreen_controlposition;

          global_settings.info_path = setting.info_path;
          global_settings.lidinfo_path = setting.lidinfo_path;
          global_settings.preload_data = setting.preload_data;
          if (setting.preload_data) {
            global_settings.getlocations_info = Drupal.settings.getlocations_info[key];
          }
          global_settings.getdirections_link = setting.getdirections_link;

          Drupal.getlocations_markers[key] = {};
          Drupal.getlocations_markers[key].coords = {};
          Drupal.getlocations_markers[key].lids = {};
          Drupal.getlocations_markers[key].cat = {};

          global_settings.locale_prefix = (setting.locale_prefix ? setting.locale_prefix + "/" : "");
          global_settings.show_bubble_on_one_marker = (setting.show_bubble_on_one_marker ? true : false);
          global_settings.minzoom = parseInt(setting.minzoom);
          global_settings.maxzoom = parseInt(setting.maxzoom);
          global_settings.nodezoom = parseInt(setting.nodezoom);

          // highlighting
          if (setting.highlight_enable) {
            global_settings.highlight_enable = setting.highlight_enable;
            global_settings.highlight_strokecolor = setting.highlight_strokecolor;
            global_settings.highlight_strokeopacity = setting.highlight_strokeopacity;
            global_settings.highlight_strokeweight = setting.highlight_strokeweight;
            global_settings.highlight_fillcolor = setting.highlight_fillcolor;
            global_settings.highlight_fillopacity = setting.highlight_fillopacity;
            global_settings.highlight_radius = setting.highlight_radius;
          }

          if (setting.minzoom_map == -1) {
            global_settings.minzoom_map = null;
          }
          else {
            global_settings.minzoom_map = parseInt(setting.minzoom_map);
          }
          if (setting.maxzoom_map == -1) {
            global_settings.maxzoom_map = null;
          }
          else {
            global_settings.maxzoom_map = parseInt(setting.maxzoom_map);
          }

          global_settings.datanum = Drupal.getlocations_data[key].datanum;

          global_settings.markermanagertype = setting.markermanagertype;
          global_settings.pansetting = setting.pansetting;
          // mobiles
          global_settings.is_mobile = setting.is_mobile;
          global_settings.show_maplinks = setting.show_maplinks;
          global_settings.show_maplinks_viewport = (setting.show_maplinks_viewport ? true : false);
          global_settings.show_search_distance = setting.show_search_distance;

          // streetview overlay settings
          global_settings.sv_showfirst              = (setting.sv_showfirst ? true : false);
          global_settings.sv_heading                = setting.sv_heading;
          global_settings.sv_zoom                   = setting.sv_zoom;
          global_settings.sv_pitch                  = setting.sv_pitch;
          global_settings.sv_addresscontrol         = (setting.sv_addresscontrol ? true : false);
          global_settings.sv_addresscontrolposition = setting.sv_addresscontrolposition;
          global_settings.sv_pancontrol             = (setting.sv_pancontrol ? true : false);
          global_settings.sv_pancontrolposition     = setting.sv_pancontrolposition;
          global_settings.sv_zoomcontrol            = setting.sv_zoomcontrol;
          global_settings.sv_zoomcontrolposition    = setting.sv_zoomcontrolposition;
          global_settings.sv_linkscontrol           = (setting.sv_linkscontrol ? true : false);
          global_settings.sv_imagedatecontrol       = (setting.sv_imagedatecontrol ? true : false);
          global_settings.sv_scrollwheel            = (setting.sv_scrollwheel ? true : false);
          global_settings.sv_clicktogo              = (setting.sv_clicktogo ? true : false);

          // prevent old msie from running markermanager
          var ver = Drupal.getlocations.msiedetect();
          var pushit = false;
          if ( (ver == '') || (ver && ver > 8)) {
            pushit = true;
          }

          if (pushit && setting.markermanagertype == 1 && setting.usemarkermanager) {
            global_settings.usemarkermanager = true;
            global_settings.useclustermanager = false;
          }
          else if (pushit && setting.markermanagertype == 2 && setting.useclustermanager == 1) {
            global_settings.cmgr_styles = Drupal.settings.getlocations_markerclusterer;
            global_settings.cmgr_style = (setting.markerclusterer_style == -1 ? null : setting.markerclusterer_style);
            global_settings.cmgr_gridSize = (setting.markerclusterer_size == -1 ? null : parseInt(setting.markerclusterer_size));
            global_settings.cmgr_maxZoom = (setting.markerclusterer_zoom == -1 ? null : parseInt(setting.markerclusterer_zoom));
            global_settings.cmgr_minClusterSize = (setting.markerclusterer_minsize == -1 ? null : parseInt(setting.markerclusterer_minsize));
            global_settings.cmgr_title = setting.markerclusterer_title;
            global_settings.cmgr_imgpath = setting.markerclusterer_imgpath;
            global_settings.useclustermanager = true;
            global_settings.usemarkermanager = false;
          }
          else {
            global_settings.usemarkermanager = false;
            global_settings.useclustermanager = false;
          }

          global_settings.markeraction = setting.markeraction;
          global_settings.markeractiontype = 'click';
          if (setting.markeractiontype == 2) {
            global_settings.markeractiontype = 'mouseover';
          }

          if (global_settings.markeraction == 1) {
            global_settings.useInfoWindow = true;
          }

          else if (global_settings.markeraction == 2) {
            global_settings.useInfoBubble = true;
          }
          else if (global_settings.markeraction == 3) {
            global_settings.useLink = true;
          }
          global_settings.markeraction_click_zoom = setting.markeraction_click_zoom;
          global_settings.markeraction_click_center = setting.markeraction_click_center;

          if((global_settings.useInfoWindow || global_settings.useInfoBubble) && setting.custom_content_enable == 1) {
            global_settings.useCustomContent = true;
          }
          global_settings.defaultIcon = Drupal.getlocations.getIcon(map_marker);

          // each map has its own data so when a map is replaced by ajax the new data is too.
          global_settings.latlons = (Drupal.getlocations_data[key].latlons ? Drupal.getlocations_data[key].latlons : '');

          // map type
          var maptypes = [];
          if (maptype) {
            if (maptype == 'Map' && baselayers.Map) { maptype = google.maps.MapTypeId.ROADMAP; }
            else if (maptype == 'Satellite' && baselayers.Satellite) { maptype = google.maps.MapTypeId.SATELLITE; }
            else if (maptype == 'Hybrid' && baselayers.Hybrid) { maptype = google.maps.MapTypeId.HYBRID; }
            else if (maptype == 'Physical' && baselayers.Physical) { maptype = google.maps.MapTypeId.TERRAIN; }

            if (baselayers.Map) { maptypes.push(google.maps.MapTypeId.ROADMAP); }
            if (baselayers.Satellite) { maptypes.push(google.maps.MapTypeId.SATELLITE); }
            if (baselayers.Hybrid) { maptypes.push(google.maps.MapTypeId.HYBRID); }
            if (baselayers.Physical) { maptypes.push(google.maps.MapTypeId.TERRAIN); }

            var copyrightNode = document.createElement('div');
            copyrightNode.id = 'copyright-control';
            copyrightNode.style.fontSize = '11px';
            copyrightNode.style.fontFamily = 'Arial, sans-serif';
            copyrightNode.style.margin = '0 2px 2px 0';
            copyrightNode.style.whiteSpace = 'nowrap';

            var baselayer_keys = new Array();
            for(var bl_key in baselayers) {
              baselayer_keys[baselayer_keys.length] = bl_key;
            }
            for (var c = 0; c < baselayer_keys.length; c++) {
              var bl_key = baselayer_keys[c];
              if ( bl_key != 'Map' && bl_key != 'Satellite' && bl_key != 'Hybrid' && bl_key != 'Physical') {
                // do stuff
                if (baselayers[bl_key]) {
                  maptypes.push(bl_key);
                  useOpenStreetMap = true;
                }
              }
            }
          }
          else {
            maptype = google.maps.MapTypeId.ROADMAP;
            maptypes.push(google.maps.MapTypeId.ROADMAP);
            maptypes.push(google.maps.MapTypeId.SATELLITE);
            maptypes.push(google.maps.MapTypeId.HYBRID);
            maptypes.push(google.maps.MapTypeId.TERRAIN);
          }
          // map styling
          var styles_array = [];
          if (map_styles) {
            try {
              styles_array = eval(map_styles);
            } catch (e) {
              if (e instanceof SyntaxError) {
                console.log(e.message);
                // Error on parsing string. Using default.
                styles_array = [];
              }
            }
          }

          // Merge styles with our settings.
          var styles = styles_array.concat([
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: (poi_show ? 'on' : 'off') }] },
            { featureType: "transit", elementType: "labels", stylers: [{ visibility: (transit_show ? 'on' : 'off') }] }
          ]);

          var controlpositions = [];
          controlpositions['tl'] = google.maps.ControlPosition.TOP_LEFT;
          controlpositions['tc'] = google.maps.ControlPosition.TOP_CENTER;
          controlpositions['tr'] = google.maps.ControlPosition.TOP_RIGHT;
          controlpositions['rt'] = google.maps.ControlPosition.RIGHT_TOP;
          controlpositions['rc'] = google.maps.ControlPosition.RIGHT_CENTER;
          controlpositions['rb'] = google.maps.ControlPosition.RIGHT_BOTTOM;
          controlpositions['br'] = google.maps.ControlPosition.BOTTOM_RIGHT;
          controlpositions['bc'] = google.maps.ControlPosition.BOTTOM_CENTER;
          controlpositions['bl'] = google.maps.ControlPosition.BOTTOM_LEFT;
          controlpositions['lb'] = google.maps.ControlPosition.LEFT_BOTTOM;
          controlpositions['lc'] = google.maps.ControlPosition.LEFT_CENTER;
          controlpositions['lt'] = google.maps.ControlPosition.LEFT_TOP;
          global_settings.controlpositions = controlpositions;

          var mapOpts = {
            zoom: selzoom,
            minZoom: global_settings.minzoom_map,
            maxZoom: global_settings.maxzoom_map,
            center: new google.maps.LatLng(lat, lng),
            mapTypeId: maptype,
            scrollwheel: (scrollw ? true : false),
            draggable: (draggable ? true : false),
            styles: styles,
            overviewMapControl: (overview ? true : false),
            overviewMapControlOptions: {opened: (overview_opened ? true : false)},
            keyboardShortcuts: (nokeyboard ? false : true),
            disableDoubleClickZoom: nodoubleclickzoom
          };
          if (map_backgroundcolor) {
            mapOpts.backgroundColor = map_backgroundcolor;
          }
          // zoom control
          if (controltype == 'none') {
            mapOpts.zoomControl = false;
          }
          else {
            mapOpts.zoomControl = true;
            var zco = {};
            if (zoomcontrolposition) {
              zco.position = controlpositions[zoomcontrolposition];
            }
            if (controltype == 'small') {
              zco.style = google.maps.ZoomControlStyle.SMALL;
            }
            else if (controltype == 'large') {
              zco.style = google.maps.ZoomControlStyle.LARGE;
            }
            if (zco) {
              mapOpts.zoomControlOptions = zco;
            }
          }

          // pancontrol
          if (pancontrol) {
            mapOpts.panControl = true;
            if (pancontrolposition) {
              mapOpts.panControlOptions = {position: controlpositions[pancontrolposition]};
            }
          }
          else {
            mapOpts.panControl = false;
          }

          // map control
          if (setting.mtc == 'none') {
            mapOpts.mapTypeControl = false;
          }
          else {
            mapOpts.mapTypeControl = true;
            var mco = {};
            mco.mapTypeIds = maptypes;
            if (setting.mtc == 'standard') {
              mco.style = google.maps.MapTypeControlStyle.HORIZONTAL_BAR;
            }
            else if (setting.mtc == 'menu') {
              mco.style = google.maps.MapTypeControlStyle.DROPDOWN_MENU;
            }
            if (mapcontrolposition) {
              mco.position = controlpositions[mapcontrolposition];
            }
            mapOpts.mapTypeControlOptions = mco;
          }

          // scale control
          if (scale) {
            mapOpts.scaleControl = true;
            if (scalecontrolposition) {
              mapOpts.ScaleControlOptions = {position: controlpositions[scalecontrolposition]};
            }
          }
          else {
            mapOpts.scaleControl = false;
          }

          // pegman
          if (sv_show) {
            mapOpts.streetViewControl = true;
            if (svcontrolposition) {
              mapOpts.StreetViewControlOptions = {position: controlpositions[svcontrolposition]};
            }
          }
          else {
            mapOpts.streetViewControl = false;
          }

          // google_old_controlstyle
          if (setting.google_old_controlstyle) {
            google.maps.controlStyle = 'azteca';
          }

          // make the map
          Drupal.getlocations_map[key] = new google.maps.Map(document.getElementById("getlocations_map_canvas_" + key), mapOpts);
          // another way
          // Drupal.getlocations_map[key] = new google.maps.Map($(element).get(0), mapOpts);

          // other maps
          // OpenStreetMap
          if (useOpenStreetMap) {
            for (var c = 0; c < baselayer_keys.length; c++) {
              var bl_key = baselayer_keys[c];
              if ( bl_key != 'Map' && bl_key != 'Satellite' && bl_key != 'Hybrid' && bl_key != 'Physical') {
                if (baselayers[bl_key] ) {
                  setupNewMap(key, bl_key);
                }
              }
            }
            google.maps.event.addListener(Drupal.getlocations_map[key], 'maptypeid_changed', updateAttribs);
            Drupal.getlocations_map[key].controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(copyrightNode);
          }

          // input map
          if (setting.inputmap) {
            Drupal.getlocations_inputmap[key] = Drupal.getlocations_map[key];
          }

          // set up markermanager
          if (global_settings.usemarkermanager) {
            global_settings.mgr = new MarkerManager(Drupal.getlocations_map[key], {
              borderPadding: 50,
              maxZoom: global_settings.maxzoom,
              trackMarkers: false
            });
          }
          else if (global_settings.useclustermanager) {
            var cmgr_settings = {
              gridSize: global_settings.cmgr_gridSize,
              maxZoom: global_settings.cmgr_maxZoom,
              styles: global_settings.cmgr_styles[global_settings.cmgr_style],
              minimumClusterSize: global_settings.cmgr_minClusterSize,
              title: global_settings.cmgr_title
            };
            if (global_settings.cmgr_imgpath) {
              cmgr_settings.imagePath = global_settings.cmgr_imgpath + '/m';
            }
            global_settings.cmgr = new MarkerClusterer(
              Drupal.getlocations_map[key],
              [],
              cmgr_settings
            );
          }

          // KML
          if (setting.kml_url) {
            var kmlLayer = {};
            var kmlLayertoggleState = [];
            kmlLayer[key] = new google.maps.KmlLayer({
              url: setting.kml_url,
              preserveViewport: (setting.kml_url_viewport ? true : false),
              clickable: (setting.kml_url_click ? true : false),
              suppressInfoWindows: (setting.kml_url_infowindow ? true : false)
            });
            if (setting.kml_url_button_state > 0) {
              kmlLayer[key].setMap(Drupal.getlocations_map[key]);
              kmlLayertoggleState[key] = true;
            }
            else {
              kmlLayer[key].setMap(null);
              kmlLayertoggleState[key] = false;
            }
            $("#getlocations_toggleKmlLayer_" + key).click( function() {
              var label = '';
              l = (setting.kml_url_button_label ? setting.kml_url_button_label : Drupal.t('Kml Layer'));
              if (kmlLayertoggleState[key]) {
                kmlLayer[key].setMap(null);
                kmlLayertoggleState[key] = false;
                label = l + ' ' + Drupal.t('On');
              }
              else {
                kmlLayer[key].setMap(Drupal.getlocations_map[key]);
                kmlLayertoggleState[key] = true;
                label = l + ' ' + Drupal.t('Off');
              }
              $(this).val(label);
            });
          }

          // Traffic Layer
          if (setting.trafficinfo) {
            var trafficInfo = {};
            var traffictoggleState = [];
            trafficInfo[key] = new google.maps.TrafficLayer();
            if (setting.trafficinfo_state > 0) {
              trafficInfo[key].setMap(Drupal.getlocations_map[key]);
              traffictoggleState[key] = true;
            }
            else {
              trafficInfo[key].setMap(null);
              traffictoggleState[key] = false;
            }
            $("#getlocations_toggleTraffic_" + key).click( function() {
              var label = '';
              if (traffictoggleState[key]) {
                trafficInfo[key].setMap(null);
                traffictoggleState[key] = false;
                label = Drupal.t('Traffic Info On');
              }
              else {
                trafficInfo[key].setMap(Drupal.getlocations_map[key]);
                traffictoggleState[key] = true;
                label = Drupal.t('Traffic Info Off');
              }
              $(this).val(label);
            });
          }

          // Bicycling Layer
          if (setting.bicycleinfo) {
            var bicycleInfo = {};
            var bicycletoggleState =  [];
            bicycleInfo[key] = new google.maps.BicyclingLayer();
            if (setting.bicycleinfo_state > 0) {
              bicycleInfo[key].setMap(Drupal.getlocations_map[key]);
              bicycletoggleState[key] = true;
            }
            else {
              bicycleInfo[key].setMap(null);
              bicycletoggleState[key] = false;
            }
            $("#getlocations_toggleBicycle_" + key).click( function() {
              var label = '';
              if (bicycletoggleState[key]) {
                bicycleInfo[key].setMap(null);
                bicycletoggleState[key] = false;
                label = Drupal.t('Bicycle Info On');
              }
              else {
                bicycleInfo[key].setMap(Drupal.getlocations_map[key]);
                bicycletoggleState[key] = true;
                label = Drupal.t('Bicycle Info Off');
              }
              $(this).val(label);
            });
          }

          // Transit Layer
          if (setting.transitinfo) {
            var transitInfo = {};
            var transittoggleState = [];
            transitInfo[key] = new google.maps.TransitLayer();
            if (setting.transitinfo_state > 0) {
              transitInfo[key].setMap(Drupal.getlocations_map[key]);
              transittoggleState[key] = true;
            }
            else {
              transitInfo[key].setMap(null);
              transittoggleState[key] = false;
            }
            $("#getlocations_toggleTransit_" + key).click( function() {
              var label = '';
              if (transittoggleState[key]) {
                transitInfo[key].setMap(null);
                transittoggleState[key] = false;
                label = Drupal.t('Transit Info On');
              }
              else {
                transitInfo[key].setMap(Drupal.getlocations_map[key]);
                transittoggleState[key] = true;
                label = Drupal.t('Transit Info Off');
              }
              $(this).val(label);
            });
          }

          // Panoramio Layer
          if (setting.panoramio_use && setting.panoramio_show) {
            var panoramioLayer = {};
            var panoramiotoggleState = [];
            panoramioLayer[key] = new google.maps.panoramio.PanoramioLayer();
            if (setting.panoramio_state > 0) {
              panoramioLayer[key].setMap(Drupal.getlocations_map[key]);
              panoramiotoggleState[key] = true;
            }
            else {
              panoramioLayer[key].setMap(null);
              panoramiotoggleState[key] = false;
            }
            $("#getlocations_togglePanoramio_" + key).click( function() {
              var label = '';
              if (panoramiotoggleState[key]) {
                panoramioLayer[key].setMap(null);
                panoramiotoggleState[key] = false;
                label = Drupal.t('Panoramio On');
              }
              else {
                panoramioLayer[key].setMap(Drupal.getlocations_map[key]);
                panoramiotoggleState[key] = true;
                label = Drupal.t('Panoramio Off');
              }
              $(this).val(label);
            });
          }

          // Weather Layer
          if (setting.weather_use) {
            if (setting.weather_show) {
              var weatherLayer = {};
              var weathertoggleState = {};
              tu = google.maps.weather.TemperatureUnit.CELSIUS;
              if (setting.weather_temp == 2) {
                tu = google.maps.weather.TemperatureUnit.FAHRENHEIT;
              }
              sp = google.maps.weather.WindSpeedUnit.KILOMETERS_PER_HOUR;
              if (setting.weather_speed == 2) {
                sp = google.maps.weather.WindSpeedUnit.METERS_PER_SECOND;
              }
              else if (setting.weather_speed == 3) {
                sp = google.maps.weather.WindSpeedUnit.MILES_PER_HOUR;
              }
              var weatherOpts =  {
                temperatureUnits: tu,
                windSpeedUnits: sp,
                clickable: (setting.weather_clickable ? true : false),
                suppressInfoWindows: (setting.weather_info ? false : true)
              };
              if (setting.weather_label > 0) {
                weatherOpts.labelColor = google.maps.weather.LabelColor.BLACK;
                if (setting.weather_label == 2) {
                  weatherOpts.labelColor = google.maps.weather.LabelColor.WHITE;
                }
              }
              weatherLayer[key] = new google.maps.weather.WeatherLayer(weatherOpts);
              if (setting.weather_state > 0) {
                weatherLayer[key].setMap(Drupal.getlocations_map[key]);
                weathertoggleState[key] = true;
              }
              else {
                weatherLayer[key].setMap(null);
                weathertoggleState[key] = false;
              }
              $("#getlocations_toggleWeather_" + key).click( function() {
                var label = '';
                if (weathertoggleState[key]) {
                  weatherLayer[key].setMap(null);
                  weathertoggleState[key] = false;
                  label = Drupal.t('Weather On');
                }
                else {
                  weatherLayer[key].setMap(Drupal.getlocations_map[key]);
                  weathertoggleState[key] = true;
                  label = Drupal.t('Weather Off');
                }
                $(this).val(label);
              });
            }
            if (setting.weather_cloud) {
              var cloudLayer = {};
              var cloudtoggleState = [];
              cloudLayer[key] = new google.maps.weather.CloudLayer();
              if (setting.weather_cloud_state > 0) {
                cloudLayer[key].setMap(Drupal.getlocations_map[key]);
                cloudtoggleState[key] = true;
              }
              else {
                cloudLayer[key].setMap(null);
                cloudtoggleState[key] = false;
              }
              $("#getlocations_toggleCloud_" + key).click( function() {
                var label = '';
                if (cloudtoggleState[key] == 1) {
                  cloudLayer[key].setMap(null);
                  cloudtoggleState[key] = false;
                  label = Drupal.t('Clouds On');
                }
                else {
                  cloudLayer[key].setMap(Drupal.getlocations_map[key]);
                  cloudtoggleState[key] = true;
                  label = Drupal.t('Clouds Off');
                }
                $(this).val(label);
              });
            }
          }

          // exporting global_settings to Drupal.getlocations_settings
          Drupal.getlocations_settings[key] = global_settings;

          // markers and bounding
          if (! setting.inputmap && ! setting.extcontrol) {

            doAllMarkers(Drupal.getlocations_map[key], global_settings, key);

            if (global_settings.show_maplinks && global_settings.show_maplinks_viewport && (global_settings.useInfoWindow || global_settings.useInfoBubble || global_settings.useLink)) {
              google.maps.event.addListener(Drupal.getlocations_map[key], 'bounds_changed', function() {
                var b = Drupal.getlocations_map[key].getBounds();
                for (var i = 0; i < Drupal.getlocations_data[key].latlons.length; i++) {
                  var a = Drupal.getlocations_data[key].latlons[i];
                  var lat = a[0];
                  var lon = a[1];
                  var lid = a[2];
                  var p = new google.maps.LatLng(lat, lon);
                  // is this point within the bounds?
                  if (b.contains(p)) {
                    // hide and show the links for markers in the current viewport
                    $("li a.lid-" + lid).show();
                  }
                  else {
                    $("li a.lid-" + lid).hide();
                  }
                }
              });
            }

            // Bounding
            Drupal.getlocations.redoMap(key);

          }

          // fullscreen
          if (fullscreen) {
            var fsdiv = '';
            $(document).keydown( function(kc) {
              var cd = (kc.keyCode ? kc.keyCode : kc.which);
              if(cd == 27){
                if($("body").hasClass("fullscreen-body-" + key)){
                  toggleFullScreen();
                }
              }
            });
            var fsdoc = document.createElement("DIV");
            var fs = new FullScreenControl(fsdoc);
            fsdoc.index = 0;
            var fs_p = controlpositions['tr'];
            if (fullscreen_controlposition) {
              var fs_p = controlpositions[fullscreen_controlposition];
            }
            Drupal.getlocations_map[key].controls[fs_p].setAt(0, fsdoc);
          }

          // search_places in getlocations_search_places.js
          if (setting.search_places && $.isFunction(Drupal.getlocations_search_places)) {
            Drupal.getlocations_search_places(key);
          }

          //geojson in getlocations_geojson.js
          if (setting.geojson_enable && setting.geojson_data && $.isFunction(Drupal.getlocations_geojson)) {
            Drupal.getlocations_geojson(key);
          }

        } // end is there really a map?

        // functions
        function FullScreenControl(fsd) {
          fsd.style.margin = "5px";
          fsd.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.4)";
          fsdiv = document.createElement("DIV");
          fsdiv.style.height = "22px";
          fsdiv.style.backgroundColor = "white";
          fsdiv.style.borderColor = "#717B87";
          fsdiv.style.borderStyle = "solid";
          fsdiv.style.borderWidth = "1px";
          fsdiv.style.cursor = "pointer";
          fsdiv.style.textAlign = "center";
          fsdiv.title = Drupal.t('Full screen');
          fsdiv.innerHTML = '<img id="btnFullScreen" src="' + js_path + 'images/fs-map-full.png"/>';
          fsd.appendChild(fsdiv);
          google.maps.event.addDomListener(fsdiv, "click", function() {
            toggleFullScreen();
          });
        }

        function toggleFullScreen() {
          var cnt = Drupal.getlocations_map[key].getCenter();
          $("#getlocations_map_wrapper_" + key).toggleClass("fullscreen");
          $("html,body").toggleClass("fullscreen-body-" + key);
          $(document).scrollTop(0);
          google.maps.event.trigger(Drupal.getlocations_map[key], "resize");
          Drupal.getlocations_map[key].setCenter(cnt);
          setTimeout( function() {
            if($("#getlocations_map_wrapper_" + key).hasClass("fullscreen")) {
              $("#btnFullScreen").attr("src", js_path + 'images/fs-map-normal.png');
              fsdiv.title = Drupal.t('Normal screen');
            }
            else {
              $("#btnFullScreen").attr("src", js_path + 'images/fs-map-full.png');
              fsdiv.title = Drupal.t('Full screen');
            }
          },200);
        }

        function doAllMarkers(map, gs, mkey) {

          var arr = gs.latlons;
          for (var i = 0; i < arr.length; i++) {
            var arr2 = arr[i];
            if (arr2.length < 2) {
              return;
            }
            var lat = arr2[0];
            var lon = arr2[1];
            var lid = arr2[2];
            var name = arr2[3];
            var mark = arr2[4];
            var lidkey = arr2[5];
            var customContent = arr2[6];
            var cat = arr2[7];

            if (mark === '') {
              gs.markdone = gs.defaultIcon;
            }
            else {
              gs.markdone = Drupal.getlocations.getIcon(mark);
            }
            var m = Drupal.getlocations.makeMarker(map, gs, lat, lon, lid, name, lidkey, customContent, cat, mkey);
            // still experimental
            Drupal.getlocations_markers[mkey].lids[lid] = m;
            if (gs.usemarkermanager || gs.useclustermanager) {
              gs.batchr.push(m);
            }
          }
          // add batchr
          if (gs.usemarkermanager) {
           gs.mgr.addMarkers(gs.batchr, gs.minzoom, gs.maxzoom);
            gs.mgr.refresh();
          }
          else if (gs.useclustermanager) {
            gs.cmgr.addMarkers(gs.batchr, 0);
          }
        }

        function updateCopyrights(attrib) {
          if (attrib) {
            copyrightNode.innerHTML = attrib;
            if (setting.trafficinfo) {
              $("#getlocations_toggleTraffic_" + key).attr('disabled', true);
            }
            if (setting.bicycleinfo) {
              $("#getlocations_toggleBicycle_" + key).attr('disabled', true);
            }
            if (setting.transitinfo) {
              $("#getlocations_toggleTransit_" + key).attr('disabled', true);
            }
          }
          else {
            copyrightNode.innerHTML = "";
            if (setting.trafficinfo) {
              $("#getlocations_toggleTraffic_" + key).attr('disabled', false);
            }
            if (setting.bicycleinfo) {
              $("#getlocations_toggleBicycle_" + key).attr('disabled', false);
            }
            if (setting.transitinfo) {
              $("#getlocations_toggleTransit_" + key).attr('disabled', false);
            }
          }
        }

        function setupNewMap(k, blk) {
          if (setting.baselayer_settings != undefined) {
            if (setting.baselayer_settings[blk] != undefined) {
              var tle = setting.baselayer_settings[blk].title;
              if (setting.mtc == 'menu') {
                tle = setting.baselayer_settings[blk].short_title;
              }
              var tilesize = parseInt(setting.baselayer_settings[blk].tilesize);
              var url_template = setting.baselayer_settings[blk].url;
              Drupal.getlocations_map[k].mapTypes.set(blk, new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                  var url = '';
                  if (url_template) {
                    url = url_template.replace(/__Z__/, zoom).replace(/__X__/, coord.x).replace(/__Y__/, coord.y);
                  }
                  return url;
                },
                tileSize: new google.maps.Size(tilesize, tilesize),
                name: tle,
                minZoom: parseInt(setting.baselayer_settings[blk].minzoom),
                maxZoom: parseInt(setting.baselayer_settings[blk].maxzoom)
              }));
            }
          }
        }

        function updateAttribs() {
          var blk = Drupal.getlocations_map[key].getMapTypeId();
          for (var c = 0; c < baselayer_keys.length; c++) {
            var bl_key = baselayer_keys[c];
            if ( bl_key != 'Map' && bl_key != 'Satellite' && bl_key != 'Hybrid' && bl_key != 'Physical') {
              if ( bl_key == blk ) {
                var attrib = setting.baselayer_settings[blk].attribution;
                if (attrib) {
                  updateCopyrights(attrib);
                }
              }
            }
            else {
              updateCopyrights('');
            }
          }
        }

        // end functions

      }); // end once
    } // end attach
  }; // end behaviors

  // external functions
  Drupal.getlocations.makeMarker = function(map, gs, lat, lon, lid, title, lidkey, customContent, cat, mkey) {

    //if (! gs.markdone) {
    //  return;
    //}

    // categories
    if (cat) {
      Drupal.getlocations_markers[mkey].cat[lid] = cat;
    }

    // check for duplicates
    var hash = new String(lat + lon);
    if (Drupal.getlocations_markers[mkey].coords[hash] == null) {
      Drupal.getlocations_markers[mkey].coords[hash] = 1;
    }
    else {
      // we have a duplicate
      // 10000 constrains the max, 0.0001 constrains the min distance
      m1 = (Math.random() /10000) + 0.0001;
      // randomise the operator
      m2 = Math.random();
      if (m2 > 0.5) {
        lat = parseFloat(lat) + m1;
      }
      else {
        lat = parseFloat(lat) - m1;
      }
      m1 = (Math.random() /10000) + 0.0001;
      m2 = Math.random();
      if (m2 > 0.5) {
        lon = parseFloat(lon) + m1;
      }
      else {
        lon = parseFloat(lon) - m1;
      }
    }

    // relocate function
    var get_winlocation = function(gs, lid, lidkey) {
      if (gs.preload_data) {
        arr = gs.getlocations_info;
        for (var i = 0; i < arr.length; i++) {
          data = arr[i];
          if (lid == data.lid && lidkey == data.lidkey && data.content) {
            window.location = data.content;
          }
        }
      }
      else {
        // fetch link and relocate
        $.get(gs.lidinfo_path, {'lid': lid, 'key': lidkey}, function(data) {
          if (data.content) {
            window.location = data.content;
          }
        });
      }
    };

    var mouseoverTimeoutId = null;
    var mouseoverTimeout = (gs.markeractiontype == 'mouseover' ? 300 : 0);
    var p = new google.maps.LatLng(lat, lon);
    var m = new google.maps.Marker({
      icon: gs.markdone.image,
      shadow: gs.markdone.shadow,
      shape: gs.markdone.shape,
      map: map,
      position: p,
      title: title,
      clickable: (gs.markeraction > 0 ? true : false),
      optimized: false
    });

    if (gs.markeraction > 0) {
      google.maps.event.addListener(m, gs.markeractiontype, function() {
        mouseoverTimeoutId = setTimeout(function() {
          if (gs.useLink) {
            // relocate
            get_winlocation(gs, lid, lidkey);
          }
          else {
            if(gs.useCustomContent) {
              var cc = [];
              cc.content = customContent;
              Drupal.getlocations.showPopup(map, m, gs, cc, mkey);
            }
            else {
              // fetch bubble content
              if (gs.preload_data) {
                arr = gs.getlocations_info;
                for (var i = 0; i < arr.length; i++) {
                  data = arr[i];
                  if (lid == data.lid && lidkey == data.lidkey && data.content) {
                    Drupal.getlocations.showPopup(map, m, gs, data, mkey);
                  }
                }
              }
              else {
                var qs = {};
                qs.lid = lid;
                qs.key = lidkey;
                qs.gdlink = gs.getdirections_link;
                var slat = false;
                var slon = false;
                var sunit = false;
                if (gs.show_distance) {
                  // getlocations_search module
                  if ($("#getlocations_search_slat_" + mkey).is('div')) {
                    var slat = $("#getlocations_search_slat_" + mkey).html();
                    var slon = $("#getlocations_search_slon_" + mkey).html();
                    var sunit = $("#getlocations_search_sunit_" + mkey).html();
                  }
                }
                else if (gs.show_search_distance) {
                  // getlocations_fields distance views filter and field
                  if ($("#getlocations_fields_search_views_search_wrapper_" + mkey).is('div')) {
                    var slat = $("#getlocations_fields_search_views_search_latitude_" + mkey).html();
                    var slon = $("#getlocations_fields_search_views_search_longitude_" + mkey).html();
                    var sunit = $("#getlocations_fields_search_views_search_units_" + mkey).html();
                  }
                }
                if (slat && slon) {
                  qs.sdist = sunit + '|' + slat + '|' + slon;
                }

                $.get(gs.info_path, qs, function(data) {
                  Drupal.getlocations.showPopup(map, m, gs, data, mkey);
                });
              }
            }

            if (gs.markeraction_click_center) {
              var mp = m.getPosition();
              if (gs.markeraction_click_center == 1) {
                map.setCenter(mp);
              }
              else {
                map.panTo(mp);
              }
            }
            if (gs.markeraction_click_zoom > -1) {
              map.setZoom(parseInt(gs.markeraction_click_zoom));
            }

          }
        }, mouseoverTimeout);
      });
      google.maps.event.addListener(m,'mouseout', function() {
        if(mouseoverTimeoutId) {
          clearTimeout(mouseoverTimeoutId);
          mouseoverTimeoutId = null;
        }
      });

    }

    // highlighting
    if (gs.markeractiontype != 'mouseover' && gs.highlight_enable) {
      var conv = [];
      var temp = 0.5;
      for (var c = 21; c > 0; c--) {
        temp += temp;
        conv[c] = temp;
      }
      var circOpts = {
        strokeColor: gs.highlight_strokecolor,
        strokeOpacity: gs.highlight_strokeopacity,
        strokeWeight: gs.highlight_strokeweight,
        fillColor: gs.highlight_fillcolor,
        fillOpacity: gs.highlight_fillopacity,
        radius: parseInt(gs.highlight_radius),
        center: p,
        map: map,
        visible: false,
        clickable: false
      };
      var circ =  new google.maps.Circle(circOpts);
      google.maps.event.addListener(m,'mouseover', function() {
        circ.setRadius(parseInt(gs.highlight_radius * conv[map.getZoom()] * 0.1));
        circ.setVisible(true);
      });
      google.maps.event.addListener(m,'mouseout', function() {
        circ.setVisible(false);
      });
    }

    // we only have one marker
    if (gs.datanum == 1) {
      if (gs.pansetting > 0) {
        map.setCenter(p);
        map.setZoom(gs.nodezoom);
      }
      // show_bubble_on_one_marker
      if (gs.show_bubble_on_one_marker && (gs.useInfoWindow || gs.useInfoBubble)) {
        google.maps.event.trigger(m, 'click');
      }
      // streetview first feature
      if (gs.sv_showfirst) {
        var popt = {
          position: p,
          pov: {
            heading: parseInt(gs.sv_heading),
            pitch: parseInt(gs.sv_pitch)
          },
          enableCloseButton: true,
          zoom: parseInt(gs.sv_zoom)
        };

        if (gs.sv_addresscontrol) {
          popt.addressControl = true;
          if (gs.sv_addresscontrolposition) {
            popt.addressControlOptions = {position: gs.controlpositions[gs.sv_addresscontrolposition]};
          }
        }
        else {
          popt.addressControl = false;
        }
        if (gs.sv_pancontrol) {
          popt.panControl = true;
          if (gs.sv_pancontrolposition) {
            popt.panControlOptions = {position: gs.controlpositions[gs.sv_pancontrolposition]};
          }
        }
        else {
          popt.panControl = false;
        }
        if (gs.sv_zoomcontrol == 'none') {
          popt.zoomControl = false;
        }
        else {
          popt.zoomControl = true;
          var zco = {};
          if (gs.sv_zoomcontrolposition) {
            zco.position = gs.controlpositions[gs.sv_zoomcontrolposition];
          }
          if (gs.sv_zoomcontrol == 'small') {
            zco.style = google.maps.ZoomControlStyle.SMALL;
          }
          else if (gs.sv_zoomcontrol == 'large') {
            zco.style = google.maps.ZoomControlStyle.LARGE;
          }
          if (zco) {
            popt.zoomControlOptions = zco;
          }
        }
        if (! gs.sv_linkscontrol) {
          popt.linksControl = false;
        }
        if (gs.sv_imagedatecontrol) {
          popt.imageDateControl = true;
        }
        else {
          popt.imageDateControl = false;
        }
        if (! gs.sv_scrollwheel) {
          popt.scrollwheel = false;
        }
        if (! gs.sv_clicktogo) {
          popt.clickToGo = false;
        }

        Drupal.getlocations_pano[mkey] = new google.maps.StreetViewPanorama(document.getElementById("getlocations_map_canvas_" + mkey), popt);
        Drupal.getlocations_pano[mkey].setVisible(true);
      }
    }

    // show_maplinks
    if (gs.show_maplinks && (gs.useInfoWindow || gs.useInfoBubble || gs.useLink)) {
      // add link
      $("div#getlocations_map_links_" + mkey + " ul").append('<li><a href="#maptop_' + mkey + '" class="lid-' + lid + '">' + title + '</a></li>');
      // Add listener
      $("div#getlocations_map_links_" + mkey + " a.lid-" + lid).click(function(){
        $("div#getlocations_map_links_" + mkey + " a").removeClass('active');
        $("div#getlocations_map_links_" + mkey + " a.lid-" + lid).addClass('active');
        if (gs.useLink) {
          // relocate
          get_winlocation(gs, lid, lidkey);
        }
        else {
          // emulate
          google.maps.event.trigger(m, 'click');
        }
      });
    }
    return m;

  };

  Drupal.getlocations.showPopup = function(map, m, gs, data, key) {
    var ver = Drupal.getlocations.msiedetect();
    var pushit = false;
    if ( (ver == '') || (ver && ver > 8)) {
      pushit = true;
    }

    if (pushit) {
      // close any previous instances
      for (var i in Drupal.getlocations_settings[key].infoBubbles) {
        Drupal.getlocations_settings[key].infoBubbles[i].close();
      }
    }

    if (gs.useInfoBubble) {
      if (typeof(infoBubbleOptions) == 'object') {
        var infoBubbleOpts = infoBubbleOptions;
      }
      else {
        var infoBubbleOpts = {};
      }
      infoBubbleOpts.content = data.content;
      var infoBubble = new InfoBubble(infoBubbleOpts);
      infoBubble.open(map, m);
      if (pushit) {
        // add to the array
        Drupal.getlocations_settings[key].infoBubbles.push(infoBubble);
      }
    }
    else {
      if (typeof(infoWindowOptions) == 'object') {
        var infoWindowOpts = infoWindowOptions;
      }
      else {
        var infoWindowOpts = {};
      }
      infoWindowOpts.content = data.content;
      var infowindow = new google.maps.InfoWindow(infoWindowOpts);
      infowindow.open(map, m);
      if (pushit) {
        // add to the array
        Drupal.getlocations_settings[key].infoBubbles.push(infowindow);
      }
    }
  };

  Drupal.getlocations.doBounds = function(map, minlat, minlon, maxlat, maxlon, dopan) {
    if (minlat !== '' && minlon !== '' && maxlat !== '' && maxlon !== '') {
      // Bounding
      var minpoint = new google.maps.LatLng(parseFloat(minlat), parseFloat(minlon));
      var maxpoint = new google.maps.LatLng(parseFloat(maxlat), parseFloat(maxlon));
      var bounds = new google.maps.LatLngBounds(minpoint, maxpoint);
      if (dopan) {
        map.panToBounds(bounds);
      }
      else {
        map.fitBounds(bounds);
      }
    }
  };

  Drupal.getlocations.redoMap = function(key) {
    var settings = Drupal.settings.getlocations[key];
    var minmaxes = (Drupal.getlocations_data[key].minmaxes ? Drupal.getlocations_data[key].minmaxes : '');
    var minlat = '';
    var minlon = '';
    var maxlat = '';
    var maxlon = '';
    var cenlat = '';
    var cenlon = '';
    if (minmaxes) {
      minlat = parseFloat(minmaxes.minlat);
      minlon = parseFloat(minmaxes.minlon);
      maxlat = parseFloat(minmaxes.maxlat);
      maxlon = parseFloat(minmaxes.maxlon);
      cenlat = ((minlat + maxlat) / 2);
      cenlon = ((minlon + maxlon) / 2);
    }
    google.maps.event.trigger(Drupal.getlocations_map[key], "resize");
    if (! settings.inputmap && ! settings.extcontrol) {
      if (settings.pansetting == 1) {
        Drupal.getlocations.doBounds(Drupal.getlocations_map[key], minlat, minlon, maxlat, maxlon, true);
      }
      else if (settings.pansetting == 2) {
        Drupal.getlocations.doBounds(Drupal.getlocations_map[key], minlat, minlon, maxlat, maxlon, false);
      }
      else if (settings.pansetting == 3 && cenlat && cenlon) {
        var c = new google.maps.LatLng(parseFloat(cenlat), parseFloat(cenlon));
        Drupal.getlocations_map[key].setCenter(c);
      }
    }
  };

  Drupal.getlocations.get_marker_from_latlon = function(k, lat, lon) {
    var lid;
    var gmark = false;
    for (lid in Drupal.getlocations_markers[k].lids) {
      mark = Drupal.getlocations_markers[k].lids[lid];
      pos = mark.getPosition();
      xlat = parseFloat(pos.lat());
      xlon = parseFloat(pos.lng());
      if (xlat.toFixed(6) == lat.toFixed(6) && xlon.toFixed(6) == lon.toFixed(6)) {
        gmark = mark;
        break;
      }
    }
    return gmark;
  };

  Drupal.getlocations.msiedetect = function() {
    var ieversion = '';
    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)){ //test for MSIE x.x;
     ieversion = new Number(RegExp.$1) // capture x.x portion and store as a number
    }
    return ieversion;
  };

  Drupal.getlocations.getGeoErrCode = function(errcode) {
    var errstr;
    if (errcode == google.maps.GeocoderStatus.ERROR) {
      errstr = Drupal.t("There was a problem contacting the Google servers.");
    }
    else if (errcode == google.maps.GeocoderStatus.INVALID_REQUEST) {
      errstr = Drupal.t("This GeocoderRequest was invalid.");
    }
    else if (errcode == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
      errstr = Drupal.t("The webpage has gone over the requests limit in too short a period of time.");
    }
    else if (errcode == google.maps.GeocoderStatus.REQUEST_DENIED) {
      errstr = Drupal.t("The webpage is not allowed to use the geocoder.");
    }
    else if (errcode == google.maps.GeocoderStatus.UNKNOWN_ERROR) {
      errstr = Drupal.t("A geocoding request could not be processed due to a server error. The request may succeed if you try again.");
    }
    else if (errcode == google.maps.GeocoderStatus.ZERO_RESULTS) {
      errstr = Drupal.t("No result was found for this GeocoderRequest.");
    }
    return errstr;
  };

  Drupal.getlocations.geolocationErrorMessages = function(error) {
    var ret = '';
    switch(error.code) {
      case error.PERMISSION_DENIED:
        ret = Drupal.t("because you didn't give me permission");
        break;
      case error.POSITION_UNAVAILABLE:
        ret = Drupal.t("because your browser couldn't determine your location");
        break;
      case error.TIMEOUT:
        ret = Drupal.t("because it was taking too long to determine your location");
        break;
      case error.UNKNOWN_ERROR:
        ret = Drupal.t("due to an unknown error");
        break;
    }
    return ret;
  };

})(jQuery);
;
/**
* hoverIntent r6 // 2011.02.26 // jQuery 1.5.1+
* <http://cherne.net/brian/resources/jquery.hoverIntent.html>
* 
* @param  f  onMouseOver function || An object with configuration options
* @param  g  onMouseOut function  || Nothing (use configuration options object)
* @author    Brian Cherne brian(at)cherne(dot)net
*/
(function($){$.fn.hoverIntent=function(f,g){var cfg={sensitivity:7,interval:100,timeout:0};cfg=$.extend(cfg,g?{over:f,out:g}:f);var cX,cY,pX,pY;var track=function(ev){cX=ev.pageX;cY=ev.pageY};var compare=function(ev,ob){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t);if((Math.abs(pX-cX)+Math.abs(pY-cY))<cfg.sensitivity){$(ob).unbind("mousemove",track);ob.hoverIntent_s=1;return cfg.over.apply(ob,[ev])}else{pX=cX;pY=cY;ob.hoverIntent_t=setTimeout(function(){compare(ev,ob)},cfg.interval)}};var delay=function(ev,ob){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t);ob.hoverIntent_s=0;return cfg.out.apply(ob,[ev])};var handleHover=function(e){var ev=jQuery.extend({},e);var ob=this;if(ob.hoverIntent_t){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t)}if(e.type=="mouseenter"){pX=ev.pageX;pY=ev.pageY;$(ob).bind("mousemove",track);if(ob.hoverIntent_s!=1){ob.hoverIntent_t=setTimeout(function(){compare(ev,ob)},cfg.interval)}}else{$(ob).unbind("mousemove",track);if(ob.hoverIntent_s==1){ob.hoverIntent_t=setTimeout(function(){delay(ev,ob)},cfg.timeout)}}};return this.bind('mouseenter',handleHover).bind('mouseleave',handleHover)}})(jQuery);;
/*
 * sf-Touchscreen v1.2b - Provides touchscreen compatibility for the jQuery Superfish plugin.
 *
 * Developer's note:
 * Built as a part of the Superfish project for Drupal (http://drupal.org/project/superfish)
 * Found any bug? have any cool ideas? contact me right away! http://drupal.org/user/619294/contact
 *
 * jQuery version: 1.3.x or higher.
 *
 * Dual licensed under the MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 */

(function($){
  $.fn.sftouchscreen = function(options){
    options = $.extend({
      mode: 'inactive',
      breakpoint: 768,
      useragent: ''
    }, options);

    function activate(menu){
      // Select hyperlinks from parent menu items.
      menu.find('li > ul').closest('li').children('a').each(function(){
        var item = $(this);
        // No .toggle() here as it's not possible to reset it.
        item.click(function(event){
          // Already clicked? proceed to the URL.
          if (item.hasClass('sf-clicked')){
            window.location = item.attr('href');
          }
          // Prevent it otherwise.
          else {
            event.preventDefault();
            item.addClass('sf-clicked');
          }
        }).closest('li').mouseleave(function(){
          // Reset everything.
          item.removeClass('sf-clicked');
        });
      });
    }
    // Return original object to support chaining.
    return this.each(function(){
      var menu = $(this),
      mode = options.mode;
      // The rest is crystal clear, isn't it? :)
      switch (mode){
        case 'always_active' :
          activate(menu);
        break;
        case 'window_width' :
          if ($(window).width() < options.breakpoint){
            activate(menu);
          }
          var timer;
          $(window).resize(function(){
            clearTimeout(timer);
            timer = setTimeout(function(){
              if ($(window).width() < options.breakpoint){
                activate(menu);
              }
            }, 100);
          });
        break;
        case 'useragent_custom' :
          if (options.useragent != ''){
            var ua = RegExp(options.useragent, 'i');
            if (navigator.userAgent.match(ua)){
              activate(menu);
            }
          }
        break;
        case 'useragent_predefined' :
          if (navigator.userAgent.match(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i)){
            activate(menu);
          }
        break;
      }
    });
  };
})(jQuery);;
/*
 * Superfish v1.4.8 - jQuery menu widget
 * Copyright (c) 2008 Joel Birch
 *
 * Dual licensed under the MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 *
 * CHANGELOG: http://users.tpg.com.au/j_birch/plugins/superfish/changelog.txt
 */
/*
 * This is not the original jQuery Supersubs plugin.
 * Please refer to the README for more information.
 */

(function($){
  $.fn.superfish = function(op){
    var sf = $.fn.superfish,
      c = sf.c,
      $arrow = $(['<span class="',c.arrowClass,'"> &#187;</span>'].join('')),
      over = function(){
        var $$ = $(this), menu = getMenu($$);
        clearTimeout(menu.sfTimer);
        $$.showSuperfishUl().siblings().hideSuperfishUl();
      },
      out = function(){
        var $$ = $(this), menu = getMenu($$), o = sf.op;
        clearTimeout(menu.sfTimer);
        menu.sfTimer=setTimeout(function(){
          o.retainPath=($.inArray($$[0],o.$path)>-1);
          $$.hideSuperfishUl();
          if (o.$path.length && $$.parents(['li.',o.hoverClass].join('')).length<1){over.call(o.$path);}
        },o.delay);
      },
      getMenu = function($menu){
        var menu = $menu.parents(['ul.',c.menuClass,':first'].join(''))[0];
        sf.op = sf.o[menu.serial];
        return menu;
      },
      addArrow = function($a){ $a.addClass(c.anchorClass).append($arrow.clone()); };

    return this.each(function() {
      var s = this.serial = sf.o.length;
      var o = $.extend({},sf.defaults,op);
      o.$path = $('li.'+o.pathClass,this).slice(0,o.pathLevels).each(function(){
        $(this).addClass([o.hoverClass,c.bcClass].join(' '))
          .filter('li:has(ul)').removeClass(o.pathClass);
      });
      sf.o[s] = sf.op = o;

      $('li:has(ul)',this)[($.fn.hoverIntent && !o.disableHI) ? 'hoverIntent' : 'hover'](over,out).each(function() {
        if (o.autoArrows) addArrow( $('>a:first-child',this) );
      })
      .not('.'+c.bcClass)
        .hideSuperfishUl();

      var $a = $('a',this);
      $a.each(function(i){
        var $li = $a.eq(i).parents('li');
        $a.eq(i).focus(function(){over.call($li);}).blur(function(){out.call($li);});
      });
      o.onInit.call(this);

    }).each(function() {
      var menuClasses = [c.menuClass];
      if (sf.op.dropShadows  && !($.browser.msie && $.browser.version < 7)) menuClasses.push(c.shadowClass);
      $(this).addClass(menuClasses.join(' '));
    });
  };

  var sf = $.fn.superfish;
  sf.o = [];
  sf.op = {};
  sf.IE7fix = function(){
    var o = sf.op;
    if ($.browser.msie && $.browser.version > 6 && o.dropShadows && o.animation.opacity!=undefined)
      this.toggleClass(sf.c.shadowClass+'-off');
    };
  sf.c = {
    bcClass: 'sf-breadcrumb',
    menuClass: 'sf-js-enabled',
    anchorClass: 'sf-with-ul',
    arrowClass: 'sf-sub-indicator',
    shadowClass: 'sf-shadow'
  };
  sf.defaults = {
    hoverClass: 'sfHover',
    pathClass: 'overideThisToUse',
    pathLevels: 1,
    delay: 800,
    animation: {opacity:'show'},
    speed: 'normal',
    autoArrows: true,
    dropShadows: true,
    disableHI: false, // true disables hoverIntent detection
    onInit: function(){}, // callback functions
    onBeforeShow: function(){},
    onShow: function(){},
    onHide: function(){}
  };
  $.fn.extend({
    hideSuperfishUl : function(){
      var o = sf.op,
        not = (o.retainPath===true) ? o.$path : '';
      o.retainPath = false;
      var $ul = $(['li.',o.hoverClass].join(''),this).add(this).not(not).removeClass(o.hoverClass)
          .find('>ul').addClass('sf-hidden');
      o.onHide.call($ul);
      return this;
    },
    showSuperfishUl : function(){
      var o = sf.op,
        sh = sf.c.shadowClass+'-off',
        $ul = this.addClass(o.hoverClass)
          .find('>ul.sf-hidden').hide().removeClass('sf-hidden');
      sf.IE7fix.call($ul);
      o.onBeforeShow.call($ul);
      $ul.animate(o.animation,o.speed,function(){ sf.IE7fix.call($ul); o.onShow.call($ul); });
      return this;
    }
  });
})(jQuery);;
/*
 * Supersubs v0.2b - jQuery plugin
 * Copyright (c) 2008 Joel Birch
 *
 * Dual licensed under the MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 *
 * This plugin automatically adjusts submenu widths of suckerfish-style menus to that of
 * their longest list item children. If you use this, please expect bugs and report them
 * to the jQuery Google Group with the word 'Superfish' in the subject line.
 *
 */
/*
 * This is not the original jQuery Supersubs plugin.
 * Please refer to the README for more information.
 */

(function($){ // $ will refer to jQuery within this closure
  $.fn.supersubs = function(options){
    var opts = $.extend({}, $.fn.supersubs.defaults, options);
    // return original object to support chaining
    return this.each(function() {
      // cache selections
      var $$ = $(this);
      // support metadata
      var o = $.meta ? $.extend({}, opts, $$.data()) : opts;
      // get the font size of menu.
      // .css('fontSize') returns various results cross-browser, so measure an em dash instead
      var fontsize = $('<li id="menu-fontsize">&#8212;</li>').css({
        'padding' : 0,
        'position' : 'absolute',
        'top' : '-99999em',
        'width' : 'auto'
      }).appendTo($$).width(); //clientWidth is faster, but was incorrect here
      // remove em dash
      $('#menu-fontsize').remove();

      // Jump on level if it's a "NavBar"
      if ($$.hasClass('sf-navbar')) {
        $$ = $('li > ul', $$);
      }
      // cache all ul elements 
      $ULs = $$.find('ul:not(.sf-megamenu)');
      // loop through each ul in menu
      $ULs.each(function(i) {
        // cache this ul
        var $ul = $ULs.eq(i);
        // get all (li) children of this ul
        var $LIs = $ul.children();
        // get all anchor grand-children
        var $As = $LIs.children('a');
        // force content to one line and save current float property
        var liFloat = $LIs.css('white-space','nowrap').css('float');
        // remove width restrictions and floats so elements remain vertically stacked
        var emWidth = $ul.add($LIs).add($As).css({
          'float' : 'none',
          'width'  : 'auto'
        })
        // this ul will now be shrink-wrapped to longest li due to position:absolute
        // so save its width as ems. Clientwidth is 2 times faster than .width() - thanks Dan Switzer
        .end().end()[0].clientWidth / fontsize;
        // add more width to ensure lines don't turn over at certain sizes in various browsers
        emWidth += o.extraWidth;
        // restrict to at least minWidth and at most maxWidth
        if (emWidth > o.maxWidth)    { emWidth = o.maxWidth; }
        else if (emWidth < o.minWidth)  { emWidth = o.minWidth; }
        emWidth += 'em';
        // set ul to width in ems
        $ul.css('width',emWidth);
        // restore li floats to avoid IE bugs
        // set li width to full width of this ul
        // revert white-space to normal
        $LIs.css({
          'float' : liFloat,
          'width' : '100%',
          'white-space' : 'normal'
        })
        // update offset position of descendant ul to reflect new width of parent
        .each(function(){
          var $childUl = $('>ul',this);
          var offsetDirection = $childUl.css('left')!==undefined ? 'left' : 'right';
          $childUl.css(offsetDirection,emWidth);
        });
      });
    });
  };
  // expose defaults
  $.fn.supersubs.defaults = {
    minWidth: 9, // requires em unit.
    maxWidth: 25, // requires em unit.
    extraWidth: 0 // extra width can ensure lines don't sometimes turn over due to slight browser differences in how they round-off values
  };
})(jQuery); // plugin code ends;
/**
 * @file
 * The Superfish Drupal Behavior to apply the Superfish jQuery plugin to lists.
 */

(function ($) {
  Drupal.behaviors.superfish = {
    attach: function (context, settings) {
      // Take a look at each list to apply Superfish to.
      $.each(settings.superfish || {}, function(index, options) {
        // Process all Superfish lists.
        $('#superfish-' + options.id, context).once('superfish', function() {
          var list = $(this);

          // Check if we are to apply the Supersubs plug-in to it.
          if (options.plugins || false) {
            if (options.plugins.supersubs || false) {
              list.supersubs(options.plugins.supersubs);
            }
          }

          // Apply Superfish to the list.
          list.superfish(options.sf);

          // Check if we are to apply any other plug-in to it.
          if (options.plugins || false) {
            if (options.plugins.touchscreen || false) {
              list.sftouchscreen(options.plugins.touchscreen);
            }
            if (options.plugins.smallscreen || false) {
              list.sfsmallscreen(options.plugins.smallscreen);
            }
            if (options.plugins.supposition || false) {
              list.supposition();
            }
            if (options.plugins.bgiframe || false) {
              list.find('ul').bgIframe({opacity:false});
            }
          }
        });
      });
    }
  };
})(jQuery);;
