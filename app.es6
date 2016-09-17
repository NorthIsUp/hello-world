var USER;
var VALUE;

function ready() {
    Bebo.User.get('me', function (err, user) {
        if (err) {
            return console.log('error retrieving user', err)
        }
        console.log('user', user);
        USER = user;
        // returns an object containing your user data
    });
    $('#click_me').click(incr);
    incr()
}

function _incr(key, obj) {
    if (!obj[key]) {
        obj[key] = 0;
    }
    obj[key] += 1;
    Bebo.Db.save('counter', obj);
    return obj
}


function sort_counters(counters) {
    return _.orderBy(counters, _.orderBy(counters, ['value', 'updated_at']));
}
function incr() {
    Bebo.Db.get('counter', {id: 1}).then(
        (data) => {
            if (data.result.length) {
                var counter = data.result[0];
            } else {
                var counter = {id: 1, value: 0};
            }

            _incr('value', counter);

            $('#counter').empty().text(counter.value);
            VALUE = counter.value;

            return counter
        }).catch(
        (err) => {
            console.log(err)
        });


    Bebo.Db.get('counter', {type: 'user_score', sort_by: 'value', sort_order: 'descending'}).then(
        (data) => {
            console.log('--------------------------------');
            var counters = data.result;

            var this_user = _.find(counters, _.matches({id: USER.user_id}));

            if (!this_user) {
                this_user = {
                    id: USER.user_id,
                    name: USER.username,
                    value: 0,
                    type: 'user_score',
                    og_index: Number.MAX_SAFE_INTEGER

                };
                counters.push(this_user);
            }

            console.log(counters);

            counters = sort_counters(counters);
            _.each(counters, (counter, i) => counter.og_index = i);
            console.log(1, _.map(counters, (v,i) => [v.name, i, v.og_index]));

            _incr('value', this_user);
            counters = sort_counters(counters);

            console.log(2, _.map(counters, (v,i) => [v.name, i, v.og_index]));
            _.each(counters, (counter, i) => {
                if(counter.og_index < i){
                    // orignal index is lower than current index, so this user was passed by current user
                    message = USER.username + ' has passed you';
                    body = 'Come back and click!';
                    console.log('i passed you', message, body);
                    Bebo.Notification.users(message, body, [counter.id]);
                }
                counter.moved_up = counter.og_index > i;

                if(counter.id == USER.user_id){
                    if(counter.og_index != 0 && i == 0){
                        message = USER.username + ' is now #1, Don\'t be a loser';
                        body = 'click for god and country';
                        console.log('#1', message, body);
                        Bebo.Notification.roster(message, body)
                    }
                }

            });


            function fs(i){
                switch(i){
                    case 0: ems = 3; break;
                    case 1: ems = 2; break;
                    case 2: ems = 1; break;
                    case 3: ems = .7; break;
                    case 4: ems = .5; break;
                    default: ems = .3; break;
                }
                return `${ems}em`;
            }
            $('#score_board').empty();
            _.each(
                sort_counters(counters),
                (counter, i) => {
                    $('#score_board').append(`<li style='font-size:${fs(i)}'>${counter.name}, ${counter.value}</li>`);
                }
            )
        }).catch(
        (err) => {
            console.log(err)
        });

}

Bebo.onReady(ready);

