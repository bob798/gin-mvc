package models

type User struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Password string `json:"password"`
}

var Users []User

func (user User) Insert() (id int64, err error) {
	result := orm.Eloquent.Create(&user)

}
