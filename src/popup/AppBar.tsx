import AppBar from '@material-ui/core/AppBar';

import Button from "@material-ui/core/Button/Button";
import IconButton from "@material-ui/core/IconButton/IconButton";
import withStyles from "@material-ui/core/styles/withStyles";
import Toolbar from "@material-ui/core/Toolbar/Toolbar";
import Typography from "@material-ui/core/Typography/Typography";
import MenuIcon from "@material-ui/icons/Menu";
import * as React from "react";


const styles = {
    root: {
        flexGrow: 1,
    },
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
};

class DolosAppBar extends React.Component {
    render() {
        // @ts-ignore
        const {classes} = this.props;
        return (
            <AppBar position="static">
                <Toolbar color="default">
                    <IconButton className={classes.menuButton} color="inherit" aria-label="Menu">
                        <MenuIcon/>
                    </IconButton>
                    <Typography variant="h6" color="inherit">
                        Dolos
                    </Typography>
                    <Button color="inherit">Something</Button>
                </Toolbar>
            </AppBar>
        );
    }
}

export default withStyles(styles)(DolosAppBar);