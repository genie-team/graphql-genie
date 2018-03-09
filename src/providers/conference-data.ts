import { UserData, UserDataController } from './user-data';


class ConferenceDataController {
  data: any;

  constructor(public user: UserDataController) { }

  async load() {
    if (this.data) {
      return this.data;
    } else {
      const rsp = await fetch('/assets/data/data.json');
      const json = await rsp.json();
      return this.processData(json);
    }
  }

  processData(data: any) {
    // just some good 'ol JS fun with objects and arrays
    // build up the data by linking speakers to sessions
    this.data = data;

    this.data.tracks = [];

    // loop through each day in the schedule
    this.data.schedule.forEach((day: any) => {
      // loop through each timeline group in the day
      day.groups.forEach((group: any) => {
        // loop through each session in the timeline group
        group.sessions.forEach((session: any) => {
          session.speakers = [];
          if (session.speakerNames) {
            session.speakerNames.forEach((speakerName: any) => {
              const speaker = this.data.speakers.find((s: any) => s.name === speakerName);
              if (speaker) {
                session.speakers.push(speaker);
                speaker.sessions = speaker.sessions || [];
                speaker.sessions.push(session);
              }
            });
          }

          if (session.tracks) {
            session.tracks.forEach((track: any) => {
              if (this.data.tracks.indexOf(track) < 0) {
                this.data.tracks.push(track);
              }
            });
          }
        });
      });
    });

    return this.data;
  }

  async getTimeline(dayIndex: number, queryText = '', excludeTracks: any[] = [], segment = 'all') {
    const data = await this.load();
    const day = data.schedule[dayIndex];
    day.shownSessions = 0;

    queryText = queryText.toLowerCase().replace(/,|\.|-/g, ' ');
    const queryWords = queryText.split(' ').filter(w => !!w.trim().length);

    day.groups.forEach((group: any) => {
      group.hide = true;

      group.sessions.forEach((session: any) => {
        // check if this session should show or not
        this.filterSession(session, queryWords, excludeTracks, segment);

        if (!session.hide) {
          // if this session is not hidden then this group should show
          group.hide = false;
          day.shownSessions++;
        }
      });

      this.mapFavorites(group.sessions);

    });
    return day;
  }

  mapFavorites(sessions) {
    sessions.map(session => {
      session.isFavorite = this.user.hasFavorite(session.name);
    });
  }

  async getSession(sessionId: string) {
    const data = await this.load();
    for (const days of data.schedule) {
      for (const group of days.groups) {
        for (const session of group.sessions) {
          if (session.id === sessionId) {
            return session;
          }
        }
      }
    }
    return null;
  }

  filterSession(session: any, queryWords: string[], excludeTracks: any[], segment: string) {
    let matchesQueryText = false;
    if (queryWords.length) {
      // of any query word is in the session name than it passes the query test
      queryWords.forEach((queryWord: string) => {
        if (session.name.toLowerCase().indexOf(queryWord) > -1) {
          matchesQueryText = true;
        }
      });
    } else {
      // if there are no query words then this session passes the query test
      matchesQueryText = true;
    }

    // if any of the sessions tracks are not in the
    // exclude tracks then this session passes the track test
    let matchesTracks = false;
    session.tracks.forEach((trackName: string) => {
      if (excludeTracks.indexOf(trackName) === -1) {
        matchesTracks = true;
      }
    });

    // if the segement is 'favorites', but session is not a user favorite
    // then this session does not pass the segment test
    let matchesSegment = false;
    if (segment === 'favorites') {
      if (this.user.hasFavorite(session.name)) {
        matchesSegment = true;
      }
    } else {
      matchesSegment = true;
    }

    // all tests must be true if it should not be hidden
    session.hide = !(matchesQueryText && matchesTracks && matchesSegment);
  }

  async getSpeakers() {
    const data = await this.load();
    return data.speakers.sort((a: any, b: any) => {
      const aName = a.name.split(' ').pop();
      const bName = b.name.split(' ').pop();
      return aName.localeCompare(bName);
    });
  }

  async getSpeaker(speakerId: string) {
    const data = await this.load();
    for (const speaker of data.speakers) {
      if (speaker.id === speakerId) return speaker;
    }
    return null;
  }

  async getTracks() {
    const data = await this.load();
    return data.tracks.sort();
  }

  async getMap() {
    const data = await this.load();
    return data.map;
  }

}

export const ConferenceData = new ConferenceDataController(UserData);
