package database

import (
	"fmt"

	"github.com/jinzhu/gorm"
)

var Eloquent *gorm.DB

func init() {
	var err error
	Eloquent, err = gorm.Open("mysql", "antbeat:antbeat@tcp(127.0.0.1:3306)/antbeat?charset=utf8&parseTime=True&loc=Local&timeout=10ms")
	if err != nil {
		fmt.Println("mysql connect error %v", err)
	}
	if Eloquent.Error != nil {
		fmt.Println("database error %v ", Eloquent.Error)
	}

}
